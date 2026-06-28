"use strict";
/**
 * migrate-ids.ts
 *
 * One-time migration: converts date-based puzzle IDs (YYYYMMDD) to
 * sequential integers (1, 2, 3, …), oldest puzzle = 1.
 *
 * Usage (from the functions/ directory):
 *   npx ts-node migrate-ids.ts
 *   npx ts-node migrate-ids.ts --dry-run    ← print plan without writing
 *
 * Safe to re-run: if a doc already has a numeric ID <= current max,
 * it is treated as already migrated and skipped.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// Load .env.local
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
        const eq = line.indexOf("=");
        if (eq < 1 || line.startsWith("#"))
            continue;
        const key = line.slice(0, eq).trim();
        if (!process.env[key])
            process.env[key] = line.slice(eq + 1).trim();
    }
}
const GAME_IDS = [
    "takes", "solitaire", "check", "smothered", "chess-solitaire",
    "queen-vs-pawn", "king-and-pawn", "rook-endgame", "zugzwang",
    "mate-in-1", "mate-in-2", "mate-in-3",
];
const BATCH_SIZE = 250; // Firestore max is 500 ops; each puzzle = set + delete = 2 ops
const dryRun = process.argv.includes("--dry-run");
async function main() {
    var _a;
    const admin = await Promise.resolve().then(() => __importStar(require("firebase-admin")));
    const { Timestamp } = await Promise.resolve().then(() => __importStar(require("firebase-admin/firestore")));
    void Timestamp;
    function getCredential() {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            return admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
        }
        const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
            path.resolve(__dirname, "./serviceAccountKey.json");
        return admin.credential.cert(keyPath);
    }
    admin.initializeApp({ credential: getCredential() });
    const db = admin.firestore();
    console.log(`\nPuzzle ID Migration — date-based → sequential`);
    console.log(`  Dry run : ${dryRun}`);
    console.log(`${"─".repeat(50)}\n`);
    let totalMigrated = 0;
    let totalSkipped = 0;
    for (const game of GAME_IDS) {
        const col = db.collection("games").doc(game).collection("puzzles");
        // Fetch all puzzles for this game, sorted oldest first.
        const snap = await col.orderBy("releaseDate", "asc").get();
        if (snap.empty) {
            console.log(`[${game.padEnd(16)}] no puzzles — skipping`);
            continue;
        }
        console.log(`[${game.padEnd(16)}] ${snap.docs.length} puzzles found`);
        let migrated = 0;
        let skipped = 0;
        // Process in batches of BATCH_SIZE puzzles (each = 1 set + 1 delete).
        const docs = snap.docs;
        for (let batchStart = 0; batchStart < docs.length; batchStart += BATCH_SIZE) {
            const chunk = docs.slice(batchStart, batchStart + BATCH_SIZE);
            const batch = db.batch();
            for (let i = 0; i < chunk.length; i++) {
                const oldDoc = chunk[i];
                const newId = batchStart + i + 1; // sequential, 1-based
                const oldId = oldDoc.id;
                if (oldId === String(newId)) {
                    // Already has the correct ID — skip.
                    skipped++;
                    continue;
                }
                const data = oldDoc.data();
                const newDocRef = col.doc(String(newId));
                const oldDocRef = col.doc(oldId);
                if (!dryRun) {
                    batch.set(newDocRef, Object.assign(Object.assign({}, data), { id: newId }));
                    batch.delete(oldDocRef);
                }
                console.log(`  ${dryRun ? "[dry] " : ""}${oldId.padEnd(10)} → ${String(newId).padEnd(5)}` +
                    `  (${(_a = data.difficulty) !== null && _a !== void 0 ? _a : "?"})` +
                    (data.releaseDate ? `  ${data.releaseDate.toDate().toLocaleDateString("en-CA")}` : ""));
                migrated++;
            }
            if (!dryRun && migrated > 0) {
                await batch.commit();
            }
        }
        console.log(`  → migrated: ${migrated}  skipped (already correct): ${skipped}\n`);
        totalMigrated += migrated;
        totalSkipped += skipped;
    }
    console.log(`${"─".repeat(50)}`);
    console.log(`Total migrated : ${totalMigrated}`);
    console.log(`Total skipped  : ${totalSkipped}`);
    if (dryRun)
        console.log(`\nDry run — no changes written.`);
}
main().catch((err) => {
    console.error("\nFatal:", err);
    process.exit(1);
});
//# sourceMappingURL=migrate-ids.js.map