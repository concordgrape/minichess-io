/**
 * backfill.ts
 *
 * Generates puzzles for a specific game and writes them to Firestore.
 * Does NOT push JSON files to GitHub — Firestore only.
 *
 * IDs are date-based (YYYYMMDD). Each generated puzzle is scheduled one day
 * after the latest existing puzzle for that game (or starting from tomorrow
 * if the collection is empty). Existing documents are skipped safely.
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
 * Requires GOOGLE_APPLICATION_CREDENTIALS to point to a Firebase service
 * account key JSON file, e.g.:
 *   export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
 *   npx ts-node backfill.ts --game=takes --count=30
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
  Difficulty,
  PuzzleBank,
  TAKES_BANK,
  SOLITAIRE_BANK,
  CHECK_BANK,
  SMOTHERED_BANK,
  CHESS_SOLITAIRE_BANK,
  QUEEN_VS_PAWN_BANK,
  KING_AND_PAWN_BANK,
  ROOK_ENDGAME_BANK,
  ZUGZWANG_BANK,
  MATE_IN_1_BANK,
  MATE_IN_2_BANK,
  MATE_IN_3_BANK,
} from "./puzzleBanks";

// ─── Config ───────────────────────────────────────────────────────────────────

const TIMEZONE = "America/New_York";

const GAME_BANKS: Record<string, PuzzleBank<object>> = {
  "takes": TAKES_BANK as PuzzleBank<object>,
  "solitaire": SOLITAIRE_BANK as PuzzleBank<object>,
  "check": CHECK_BANK as PuzzleBank<object>,
  "smothered": SMOTHERED_BANK as PuzzleBank<object>,
  "chess-solitaire": CHESS_SOLITAIRE_BANK as PuzzleBank<object>,
  "queen-vs-pawn": QUEEN_VS_PAWN_BANK as PuzzleBank<object>,
  "king-and-pawn": KING_AND_PAWN_BANK as PuzzleBank<object>,
  "rook-endgame": ROOK_ENDGAME_BANK as PuzzleBank<object>,
  "zugzwang": ZUGZWANG_BANK as PuzzleBank<object>,
  "mate-in-1": MATE_IN_1_BANK as PuzzleBank<object>,
  "mate-in-2": MATE_IN_2_BANK as PuzzleBank<object>,
  "mate-in-3": MATE_IN_3_BANK as PuzzleBank<object>,
};

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

function randomDifficulty(): Difficulty {
  const r = Math.random();
  if (r < 1 / 3) return "easy";
  if (r < 2 / 3) return "medium";
  return "hard";
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function selectFromBank<T>(bank: PuzzleBank<T>, difficulty: Difficulty): { difficulty: Difficulty; data: T } {
  const order: Difficulty[] = difficulty === "easy"
    ? ["easy", "medium", "hard"]
    : difficulty === "medium"
    ? ["medium", "easy", "hard"]
    : ["hard", "medium", "easy"];

  for (const diff of order) {
    if (bank[diff].length > 0) return { difficulty: diff, data: pick(bank[diff]) };
  }
  throw new Error("Puzzle bank is empty");
}

/** Advance a Date by N days, returning midnight EST as UTC. */
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

  if (!game || !GAME_BANKS[game]) {
    console.error(`\nError: --game must be one of:\n  ${Object.keys(GAME_BANKS).join(", ")}\n`);
    process.exit(1);
  }
  if (isNaN(count) || count < 1) {
    console.error("Error: --count must be a positive integer");
    process.exit(1);
  }

  const bank = GAME_BANKS[game];
  const col = db.collection("games").doc(game).collection("puzzles");

  console.log(`\nMinichess Backfill`);
  console.log(`  Game    : ${game}`);
  console.log(`  Count   : ${count}`);
  console.log(`  Dry run : ${dryRun}\n`);

  // Find the oldest existing puzzle so we can extend backwards from it
  const existingSnap = await col.orderBy("releaseDate", "asc").limit(1).get();
  let oldest: Date;
  if (!existingSnap.empty) {
    const oldestTs = existingSnap.docs[0].data().releaseDate;
    const oldestDate: Date = oldestTs?.toDate?.() ?? new Date(oldestTs);
    // Anchor the new batch so game #count lands the day before the oldest existing game
    oldest = addDays(oldestDate, -count);
    console.log(`  Existing oldest : ${oldestDate.toLocaleDateString("en-CA", { timeZone: TIMEZONE })}`);
    console.log(`  Inserting before it, from ${oldest.toLocaleDateString("en-CA", { timeZone: TIMEZONE })}\n`);
  } else {
    // No existing games — game #count = today, game #1 = (count-1) days ago
    const today = todayEST();
    oldest = addDays(today, -(count - 1));
    console.log(`  Game #1  : ${oldest.toLocaleDateString("en-CA", { timeZone: TIMEZONE })}`);
    console.log(`  Game #${count} : ${today.toLocaleDateString("en-CA", { timeZone: TIMEZONE })}\n`);
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < count; i++) {
    const releaseDate = addDays(oldest, i);
    const id = dateToId(releaseDate);
    const docRef = col.doc(String(id));

    // Skip if already exists
    if (!dryRun) {
      const existing = await docRef.get();
      if (existing.exists) {
        console.log(`  ⏭  ${id} — already exists, skipping`);
        skipped++;
        continue;
      }
    }

    try {
      const difficulty = randomDifficulty();
      const { difficulty: actual, data } = selectFromBank(bank, difficulty);

      if (!dryRun) {
        // Firestore doesn't allow nested arrays — serialize any array-of-arrays to JSON strings
        const serialized = Object.fromEntries(
          Object.entries(data as Record<string, unknown>).map(([k, v]) => [
            k,
            Array.isArray(v) && v.some(Array.isArray) ? JSON.stringify(v) : v,
          ])
        );
        await docRef.set({
          id,
          difficulty: actual,
          gameType: game,
          ...serialized,
          releaseDate: Timestamp.fromDate(releaseDate),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: "scheduled",
          autoGenerated: true,
        });
      }

      const dateStr = releaseDate.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
      console.log(`  ✅ #${i + 1} ${dateStr} (id ${id}) — ${actual}${dryRun ? " [dry run]" : ""}`);
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
