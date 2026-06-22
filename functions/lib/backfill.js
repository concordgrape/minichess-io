"use strict";
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
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const path = __importStar(require("path"));
const puzzleBanks_1 = require("./puzzleBanks");
// ─── Config ───────────────────────────────────────────────────────────────────
const TIMEZONE = "America/New_York";
const GAME_BANKS = {
    "takes": puzzleBanks_1.TAKES_BANK,
    "solitaire": puzzleBanks_1.SOLITAIRE_BANK,
    "check": puzzleBanks_1.CHECK_BANK,
    "smothered": puzzleBanks_1.SMOTHERED_BANK,
    "chess-solitaire": puzzleBanks_1.CHESS_SOLITAIRE_BANK,
    "queen-vs-pawn": puzzleBanks_1.QUEEN_VS_PAWN_BANK,
    "king-and-pawn": puzzleBanks_1.KING_AND_PAWN_BANK,
    "rook-endgame": puzzleBanks_1.ROOK_ENDGAME_BANK,
    "zugzwang": puzzleBanks_1.ZUGZWANG_BANK,
    "mate-in-1": puzzleBanks_1.MATE_IN_1_BANK,
    "mate-in-2": puzzleBanks_1.MATE_IN_2_BANK,
    "mate-in-3": puzzleBanks_1.MATE_IN_3_BANK,
};
// ─── Firebase init ────────────────────────────────────────────────────────────
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.resolve(__dirname, "./serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(keyPath) });
const db = admin.firestore();
// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseArgs() {
    var _a, _b;
    const args = process.argv.slice(2);
    const get = (flag) => { var _a; return (_a = args.find((a) => a.startsWith(`--${flag}=`))) === null || _a === void 0 ? void 0 : _a.split("=")[1]; };
    const game = (_a = get("game")) !== null && _a !== void 0 ? _a : "";
    const count = parseInt((_b = get("count")) !== null && _b !== void 0 ? _b : "30", 10);
    const dryRun = args.includes("--dry-run");
    return { game, count, dryRun };
}
function randomDifficulty() {
    const r = Math.random();
    if (r < 1 / 3)
        return "easy";
    if (r < 2 / 3)
        return "medium";
    return "hard";
}
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function selectFromBank(bank, difficulty) {
    const order = difficulty === "easy"
        ? ["easy", "medium", "hard"]
        : difficulty === "medium"
            ? ["medium", "easy", "hard"]
            : ["hard", "medium", "easy"];
    for (const diff of order) {
        if (bank[diff].length > 0)
            return { difficulty: diff, data: pick(bank[diff]) };
    }
    throw new Error("Puzzle bank is empty");
}
/** Advance a Date by N days, returning midnight EST as UTC. */
function addDays(date, days) {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + days);
    return d;
}
/** Convert a JS Date to YYYYMMDD integer in EST. */
function dateToId(date) {
    const estStr = date.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
    return parseInt(estStr.replace(/-/g, ""), 10);
}
/**
 * Find the latest scheduled releaseDate in games/{gameId}/puzzles.
 * Returns tomorrow (midnight EST) if the collection is empty.
 */
async function getNextReleaseDate(gameId) {
    const snap = await db
        .collection("games")
        .doc(gameId)
        .collection("puzzles")
        .orderBy("releaseDate", "desc")
        .limit(1)
        .get();
    const nowEST = new Date(new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE }) + "T05:00:00.000Z");
    const tomorrow = addDays(nowEST, 1);
    if (snap.empty)
        return tomorrow;
    const latest = snap.docs[0].data().releaseDate;
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
                await docRef.set(Object.assign(Object.assign({ id, difficulty: actual, gameType: game }, data), { releaseDate: firestore_1.Timestamp.fromDate(releaseDate), createdAt: admin.firestore.FieldValue.serverTimestamp(), status: "scheduled", autoGenerated: true }));
            }
            const dateStr = releaseDate.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
            console.log(`  ✅ ${dateStr} (id ${id}) — ${actual}${dryRun ? " [dry run]" : ""}`);
            created++;
        }
        catch (err) {
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
//# sourceMappingURL=backfill.js.map