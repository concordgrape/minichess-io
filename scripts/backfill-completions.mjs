/**
 * One-time backfill: recompute users/{uid}.difficultyCompletions from the
 * per-puzzle score docs (games/{game}/puzzles/{id}/scores/{uid}).
 *
 * The old submit-route logic only counted a "solve" when the per-GAME best
 * improved, so counts are under- or over-stated. The correct definition
 * (matching the fixed route) is: one solve per distinct puzzle completed,
 * bucketed by game + difficulty.
 *
 * Usage:
 *   node scripts/backfill-completions.mjs           # dry run (prints changes)
 *   node scripts/backfill-completions.mjs --apply   # write to Firestore
 */
import { readFileSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Load FIREBASE_SERVICE_ACCOUNT_KEY from .env.local
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const match = env.match(/^FIREBASE_SERVICE_ACCOUNT_KEY=(.*)$/m);
if (!match) { console.error("FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local"); process.exit(1); }
const key = JSON.parse(match[1].replace(/^['"]|['"]$/g, ""));

initializeApp({ credential: cert(key) });
const db = getFirestore();

const apply = process.argv.includes("--apply");

// All "scores" collection-group docs; per-puzzle ones have 6 path segments:
//   games/{game}/puzzles/{puzzleId}/scores/{uid}
// (per-game bests are games/{game}/scores/{uid} — 4 segments — and are skipped)
const snap = await db.collectionGroup("scores").get();

/** uid → gameId → difficulty → count of distinct puzzles */
const counts = new Map();

let perPuzzleDocs = 0;
for (const doc of snap.docs) {
  const segments = doc.ref.path.split("/");
  if (segments.length !== 6) continue;
  perPuzzleDocs++;
  const gameId = segments[1];
  const { uid, difficulty } = doc.data();
  if (!uid || !difficulty) continue;
  const byGame = counts.get(uid) ?? {};
  const byDiff = byGame[gameId] ?? {};
  byDiff[difficulty] = (byDiff[difficulty] ?? 0) + 1;
  byGame[gameId] = byDiff;
  counts.set(uid, byGame);
}

console.log(`Scanned ${snap.size} score docs (${perPuzzleDocs} per-puzzle). ${counts.size} users to update.\n`);

for (const [uid, difficultyCompletions] of counts) {
  const userSnap = await db.collection("users").doc(uid).get();
  const before = userSnap.data()?.difficultyCompletions ?? {};
  const beforeStr = JSON.stringify(before);
  const afterStr = JSON.stringify(difficultyCompletions);
  const changed = beforeStr !== afterStr;
  console.log(`${uid}: ${changed ? "CHANGE" : "same"}\n  before: ${beforeStr}\n  after:  ${afterStr}`);
  if (apply && changed) {
    await db.collection("users").doc(uid).set({ difficultyCompletions }, { merge: true });
  }
}

console.log(apply ? "\nApplied." : "\nDry run — re-run with --apply to write.");
