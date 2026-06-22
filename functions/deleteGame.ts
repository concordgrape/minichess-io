/**
 * deleteGame.ts — deletes all puzzles in a game's Firestore subcollection.
 *
 * Usage (from functions/):
 *   npx ts-node deleteGame.ts --game=takes
 */

import * as admin from "firebase-admin";
import * as path from "path";

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

async function main() {
  const game = process.argv.find((a) => a.startsWith("--game="))?.split("=")[1];
  if (!game) { console.error("Usage: npx ts-node deleteGame.ts --game=<gameId>"); process.exit(1); }

  const col = db.collection("games").doc(game).collection("puzzles");
  const snap = await col.get();
  if (snap.empty) { console.log(`No puzzles found for "${game}".`); return; }

  console.log(`Deleting ${snap.size} puzzles from "${game}"…`);
  const BATCH = 400;
  for (let i = 0; i < snap.docs.length; i += BATCH) {
    const batch = db.batch();
    snap.docs.slice(i, i + BATCH).forEach((d) => batch.delete(d.ref));
    await batch.commit();
    console.log(`  deleted ${Math.min(i + BATCH, snap.docs.length)} / ${snap.docs.length}`);
  }
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
