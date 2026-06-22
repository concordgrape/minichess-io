/**
 * backfill.ts
 *
 * Generates puzzles for a specific game and writes them to Firestore.
 * Does NOT push JSON files to GitHub — Firestore only.
 *
 * Puzzles are produced by the algorithmic generators in generate.ts (the same
 * ones the daily Cloud Function uses), so every puzzle is solvable, difficulty
 * is randomised, and positions never duplicate.
 *
 * IDs are date-based (YYYYMMDD). For a fresh collection, game #count lands on
 * today and the rest fill the preceding days; if puzzles already exist, the new
 * batch is inserted immediately before the oldest one. Existing docs are skipped.
 *
 * Usage (from the functions/ directory):
 *
 *   npx ts-node backfill.ts --game=takes --count=30
 *   npx ts-node backfill.ts --game=mate-in-2 --count=60 --dry-run
 *
 * Available games:
 *   takes, solitaire, check, smothered, chess-solitaire,
 *   queen-vs-pawn, king-and-pawn, rook-endgame, zugzwang,
 *   mate-in-1, mate-in-2, mate-in-3
 *
 * Requires a service account either via FIREBASE_SERVICE_ACCOUNT_KEY (JSON
 * string, e.g. in .env.local) or GOOGLE_APPLICATION_CREDENTIALS (keyfile path).
 */

import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import * as path from "path";
import * as fs from "fs";

// Load .env.local if present (for local dev without a keyfile)
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq < 1 || line.startsWith("#")) continue;
    const key = line.slice(0, eq).trim();
    if (!process.env[key]) process.env[key] = line.slice(eq + 1).trim();
  }
}

import {
  GAME_IDS, isGameId, randomDifficulty, generatePuzzle,
  puzzleSignature, serializeForFirestore, type GameId,
} from "./generate";

// ─── Config ───────────────────────────────────────────────────────────────────

const TIMEZONE = "America/New_York";

// ─── Firebase init ────────────────────────────────────────────────────────────

function getCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
  }
  const keyPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.resolve(__dirname, "./serviceAccountKey.json");
  return admin.credential.cert(keyPath);
}

admin.initializeApp({ credential: getCredential() });
const db = admin.firestore();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseArgs(): { game: string; count: number; dryRun: boolean } {
  const args = process.argv.slice(2);
  const get = (flag: string) =>
    args.find((a) => a.startsWith(`--${flag}=`))?.split("=")[1];

  const game = get("game") ?? "";
  const count = parseInt(get("count") ?? "30", 10);
  const dryRun = args.includes("--dry-run");
  return { game, count, dryRun };
}

/** Generate a puzzle that is not a duplicate of any in `seen` (best effort). */
function generateUnique(game: GameId, seen: Set<string>) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const result = generatePuzzle(game, randomDifficulty());
    const sig = puzzleSignature(game, result.data);
    if (!seen.has(sig)) { seen.add(sig); return result; }
  }
  // Give up on uniqueness after many tries — still a valid, solvable puzzle.
  return generatePuzzle(game, randomDifficulty());
}

/** Advance a Date by N days (UTC). */
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Convert a JS Date to YYYYMMDD integer in EST. */
function dateToId(date: Date): number {
  const estStr = date.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
  return parseInt(estStr.replace(/-/g, ""), 10);
}

/** Midnight EST today as UTC. */
function todayEST(): Date {
  return new Date(
    new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE }) + "T05:00:00.000Z"
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { game, count, dryRun } = parseArgs();

  if (!game || !isGameId(game)) {
    console.error(`\nError: --game must be one of:\n  ${GAME_IDS.join(", ")}\n`);
    process.exit(1);
  }
  if (isNaN(count) || count < 1) {
    console.error("Error: --count must be a positive integer");
    process.exit(1);
  }

  const col = db.collection("games").doc(game).collection("puzzles");

  console.log(`\nMinichess Backfill`);
  console.log(`  Game    : ${game}`);
  console.log(`  Count   : ${count}`);
  console.log(`  Dry run : ${dryRun}\n`);

  // Find the oldest existing puzzle so we can extend backwards from it.
  const existingSnap = await col.orderBy("releaseDate", "asc").limit(1).get();
  let oldest: Date;
  if (!existingSnap.empty) {
    const oldestTs = existingSnap.docs[0].data().releaseDate;
    const oldestDate: Date = oldestTs?.toDate?.() ?? new Date(oldestTs);
    // Anchor the new batch so game #count lands the day before the oldest existing game.
    oldest = addDays(oldestDate, -count);
    console.log(`  Existing oldest : ${oldestDate.toLocaleDateString("en-CA", { timeZone: TIMEZONE })}`);
    console.log(`  Inserting before it, from ${oldest.toLocaleDateString("en-CA", { timeZone: TIMEZONE })}\n`);
  } else {
    // No existing games — game #count = today, game #1 = (count-1) days ago.
    const today = todayEST();
    oldest = addDays(today, -(count - 1));
    console.log(`  Game #1  : ${oldest.toLocaleDateString("en-CA", { timeZone: TIMEZONE })}`);
    console.log(`  Game #${count} : ${today.toLocaleDateString("en-CA", { timeZone: TIMEZONE })}\n`);
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;
  const seen = new Set<string>();

  for (let i = 0; i < count; i++) {
    const releaseDate = addDays(oldest, i);
    const id = dateToId(releaseDate);
    const docRef = col.doc(String(id));

    // Skip if already exists.
    if (!dryRun) {
      const existing = await docRef.get();
      if (existing.exists) {
        console.log(`  ⏭  ${id} — already exists, skipping`);
        skipped++;
        continue;
      }
    }

    try {
      const { difficulty, data } = generateUnique(game, seen);

      if (!dryRun) {
        await docRef.set({
          id,
          difficulty,
          gameType: game,
          ...serializeForFirestore(data),
          releaseDate: Timestamp.fromDate(releaseDate),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: "scheduled",
          autoGenerated: true,
        });
      }

      const dateStr = releaseDate.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
      console.log(`  ✅ #${i + 1} ${dateStr} (id ${id}) — ${difficulty}${dryRun ? " [dry run]" : ""}`);
      created++;
    } catch (err) {
      const dateStr = releaseDate.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
      console.error(`  ❌ #${i + 1} ${dateStr} (id ${id}) — failed:`, err);
      failed++;
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Done — created: ${created} | skipped: ${skipped} | failed: ${failed}`);
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
