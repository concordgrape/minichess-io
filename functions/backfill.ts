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

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.resolve(__dirname, "./serviceAccountKey.json");

admin.initializeApp({ credential: admin.credential.cert(keyPath) });
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

/**
 * Find the latest scheduled releaseDate in games/{gameId}/puzzles.
 * Returns tomorrow (midnight EST) if the collection is empty.
 */
async function getNextReleaseDate(gameId: string): Promise<Date> {
  const snap = await db
    .collection("games")
    .doc(gameId)
    .collection("puzzles")
    .orderBy("releaseDate", "desc")
    .limit(1)
    .get();

  const nowEST = new Date(
    new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE }) + "T05:00:00.000Z"
  );
  const tomorrow = addDays(nowEST, 1);

  if (snap.empty) return tomorrow;

  const latest: Timestamp = snap.docs[0].data().releaseDate;
  const latestDate = new Date(latest.toDate().toLocaleDateString("en-CA", { timeZone: TIMEZONE }) + "T05:00:00.000Z");

  // If latest is in the future, schedule one day after it; otherwise start from tomorrow
  return latestDate >= nowEST ? addDays(latestDate, 1) : tomorrow;
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

  let startDate = await getNextReleaseDate(game);
  console.log(`  Starting from: ${startDate.toLocaleDateString("en-CA", { timeZone: TIMEZONE })}\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < count; i++) {
    const releaseDate = addDays(startDate, i);
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
        await docRef.set({
          id,
          difficulty: actual,
          gameType: game,
          ...data,
          releaseDate: Timestamp.fromDate(releaseDate),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: "scheduled",
          autoGenerated: true,
        });
      }

      const dateStr = releaseDate.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
      console.log(`  ✅ ${dateStr} (id ${id}) — ${actual}${dryRun ? " [dry run]" : ""}`);
      created++;
    } catch (err) {
      const dateStr = releaseDate.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
      console.error(`  ❌ ${dateStr} (id ${id}) — failed:`, err);
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
