"use strict";
/**
 * backfill.ts
 *
 * Generates puzzles for one or all games and writes them to Firestore.
 *
 * Usage (from the functions/ directory):
 *
 *   npx ts-node backfill.ts --game=takes --count=30
 *   npx ts-node backfill.ts --all --count=10        ← parallel worker threads
 *   npx ts-node backfill.ts --game=mate-in-2 --count=60 --dry-run
 *
 * --all spawns one worker thread per game so all 12 run in parallel.
 * The algorithm is identical to the single-game path — no shortcuts.
 *
 * Available games:
 *   takes, solitaire, check, smothered, chess-solitaire,
 *   queen-vs-pawn, king-and-pawn, rook-endgame, zugzwang,
 *   mate-in-1, mate-in-2, mate-in-3
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
const worker_threads_1 = require("worker_threads");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// Load .env.local before any other imports so credentials are available.
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
// ─── Worker entry point ───────────────────────────────────────────────────────
// When this file is loaded as a worker thread, workerData contains { game, count, dryRun }.
// The worker runs the full generation pipeline and posts log lines back to the main thread.
if (!worker_threads_1.isMainThread) {
    runWorker().catch((err) => {
        worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({ type: "error", text: String(err) });
        process.exit(1);
    });
}
async function runWorker() {
    var _a;
    const { game, count, dryRun } = worker_threads_1.workerData;
    // Each worker needs its own Firebase admin instance.
    const admin = await Promise.resolve().then(() => __importStar(require("firebase-admin")));
    const { Timestamp } = await Promise.resolve().then(() => __importStar(require("firebase-admin/firestore")));
    const generate = await Promise.resolve().then(() => __importStar(require("./generate")));
    const { isGameId, randomDifficulty, generatePuzzle, puzzleSignature, serializeForFirestore } = generate;
    function log(text) {
        worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({ type: "log", game, text });
    }
    if (!isGameId(game)) {
        log(`Unknown game: ${game}`);
        return;
    }
    function getCredential() {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            return admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
        }
        const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
            path.resolve(__dirname, "./serviceAccountKey.json");
        return admin.credential.cert(keyPath);
    }
    // Each worker gets a unique app name to avoid "already initialized" errors.
    const appName = `worker-${game}`;
    const app = admin.initializeApp({ credential: getCredential() }, appName);
    const db = admin.firestore(app);
    const col = db.collection("games").doc(game).collection("puzzles");
    function generateUnique(gid, seen) {
        for (let attempt = 0; attempt < 50; attempt++) {
            const result = generatePuzzle(gid, randomDifficulty());
            const sig = puzzleSignature(gid, result.data);
            if (!seen.has(sig)) {
                seen.add(sig);
                return result;
            }
        }
        return generatePuzzle(gid, randomDifficulty());
    }
    // Find the current max sequential ID so new puzzles continue from there.
    // Filter to IDs below 20000000 to guard against any stray date-based IDs.
    const maxSnap = await col.where("id", "<", 20000000).orderBy("id", "desc").limit(1).get();
    const maxId = maxSnap.empty ? 0 : ((_a = maxSnap.docs[0].data().id) !== null && _a !== void 0 ? _a : 0);
    let created = 0;
    let skipped = 0;
    let failed = 0;
    const seen = new Set();
    for (let i = 0; i < count; i++) {
        const id = maxId + i + 1;
        const docRef = col.doc(String(id));
        if (!dryRun) {
            const existing = await docRef.get();
            if (existing.exists) {
                log(`  ⏭  #${id} — already exists`);
                skipped++;
                continue;
            }
        }
        try {
            const { difficulty, data } = generateUnique(game, seen);
            if (!dryRun) {
                await docRef.set(Object.assign(Object.assign({ id,
                    difficulty, gameType: game }, serializeForFirestore(data)), { releaseDate: Timestamp.fromMillis(Date.now()), createdAt: admin.firestore.FieldValue.serverTimestamp(), status: "scheduled", autoGenerated: true }));
            }
            log(`  ✅ #${id} — ${difficulty}${dryRun ? " [dry]" : ""}`);
            created++;
        }
        catch (err) {
            log(`  ❌ #${id} — ${err}`);
            failed++;
        }
    }
    worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({ type: "done", game, created, skipped, failed });
}
// ─── Main thread ──────────────────────────────────────────────────────────────
if (worker_threads_1.isMainThread) {
    main().catch((err) => {
        console.error("\nFatal:", err);
        process.exit(1);
    });
}
function parseArgs() {
    var _a, _b;
    const args = process.argv.slice(2);
    const get = (flag) => { var _a; return (_a = args.find((a) => a.startsWith(`--${flag}=`))) === null || _a === void 0 ? void 0 : _a.split("=")[1]; };
    return {
        game: (_a = get("game")) !== null && _a !== void 0 ? _a : "",
        count: parseInt((_b = get("count")) !== null && _b !== void 0 ? _b : "30", 10),
        dryRun: args.includes("--dry-run"),
        all: args.includes("--all"),
    };
}
async function main() {
    var _a;
    const { game, count, dryRun, all } = parseArgs();
    if (all) {
        await runAllParallel(count, dryRun);
        return;
    }
    // Single-game path (original behaviour).
    const admin = await Promise.resolve().then(() => __importStar(require("firebase-admin")));
    const { Timestamp } = await Promise.resolve().then(() => __importStar(require("firebase-admin/firestore")));
    const generate2 = await Promise.resolve().then(() => __importStar(require("./generate")));
    const { GAME_IDS, isGameId, randomDifficulty, generatePuzzle, puzzleSignature, serializeForFirestore } = generate2;
    if (!game || !isGameId(game)) {
        console.error(`\nError: --game must be one of:\n  ${GAME_IDS.join(", ")}\n`);
        console.error(`Or pass --all to generate all games in parallel.\n`);
        process.exit(1);
    }
    if (isNaN(count) || count < 1) {
        console.error("Error: --count must be a positive integer");
        process.exit(1);
    }
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
    const col = db.collection("games").doc(game).collection("puzzles");
    console.log(`\nMinichess Backfill`);
    console.log(`  Game    : ${game}`);
    console.log(`  Count   : ${count}`);
    console.log(`  Dry run : ${dryRun}\n`);
    function generateUnique(gid, seen) {
        for (let attempt = 0; attempt < 50; attempt++) {
            const result = generatePuzzle(gid, randomDifficulty());
            const sig = puzzleSignature(gid, result.data);
            if (!seen.has(sig)) {
                seen.add(sig);
                return result;
            }
        }
        return generatePuzzle(gid, randomDifficulty());
    }
    // Find the current max sequential ID so new puzzles continue from there.
    // Filter to IDs below 20000000 to guard against any stray date-based IDs.
    const maxSnap = await col.where("id", "<", 20000000).orderBy("id", "desc").limit(1).get();
    const maxId = maxSnap.empty ? 0 : ((_a = maxSnap.docs[0].data().id) !== null && _a !== void 0 ? _a : 0);
    console.log(`  Starting from ID : ${maxId + 1}\n`);
    let created = 0, skipped = 0, failed = 0;
    const seen = new Set();
    for (let i = 0; i < count; i++) {
        const id = maxId + i + 1;
        const docRef = col.doc(String(id));
        if (!dryRun) {
            const existing = await docRef.get();
            if (existing.exists) {
                console.log(`  ⏭  #${id} — already exists, skipping`);
                skipped++;
                continue;
            }
        }
        try {
            const { difficulty, data } = generateUnique(game, seen);
            if (!dryRun) {
                await docRef.set(Object.assign(Object.assign({ id, difficulty, gameType: game }, serializeForFirestore(data)), { releaseDate: Timestamp.fromMillis(Date.now()), createdAt: admin.firestore.FieldValue.serverTimestamp(), status: "scheduled", autoGenerated: true }));
            }
            console.log(`  ✅ #${id} — ${difficulty}${dryRun ? " [dry]" : ""}`);
            created++;
        }
        catch (err) {
            console.error(`  ❌ #${id} — ${err}`);
            failed++;
        }
    }
    console.log(`\n${"─".repeat(50)}`);
    console.log(`Done — created: ${created} | skipped: ${skipped} | failed: ${failed}`);
}
// ─── Parallel runner ──────────────────────────────────────────────────────────
async function runAllParallel(count, dryRun) {
    var _a;
    const { GAME_IDS } = await Promise.resolve().then(() => __importStar(require("./generate")));
    console.log(`\nMinichess Parallel Backfill`);
    console.log(`  Games   : all ${GAME_IDS.length}`);
    console.log(`  Count   : ${count} per game`);
    console.log(`  Dry run : ${dryRun}`);
    console.log(`  Threads : ${GAME_IDS.length} (one per game)\n`);
    console.log(`${"─".repeat(50)}\n`);
    const totals = {};
    await Promise.all(GAME_IDS.map((game) => new Promise((resolve, reject) => {
        const worker = new worker_threads_1.Worker(__filename, {
            workerData: { game, count, dryRun },
            // ts-node registers TypeScript so the worker can import .ts files.
            execArgv: ["--require", "ts-node/register"],
        });
        worker.on("message", (msg) => {
            var _a, _b, _c;
            if (msg.type === "log") {
                console.log(`[${msg.game.padEnd(15)}] ${msg.text}`);
            }
            else if (msg.type === "done") {
                totals[msg.game] = {
                    created: (_a = msg.created) !== null && _a !== void 0 ? _a : 0,
                    skipped: (_b = msg.skipped) !== null && _b !== void 0 ? _b : 0,
                    failed: (_c = msg.failed) !== null && _c !== void 0 ? _c : 0,
                };
            }
            else if (msg.type === "error") {
                console.error(`[${msg.game.padEnd(15)}] ERROR: ${msg.text}`);
            }
        });
        worker.on("error", reject);
        worker.on("exit", (code) => {
            if (code !== 0)
                reject(new Error(`Worker for ${game} exited with code ${code}`));
            else
                resolve();
        });
    })));
    console.log(`\n${"─".repeat(50)}`);
    console.log(`\nSummary:\n`);
    let totalCreated = 0, totalSkipped = 0, totalFailed = 0;
    for (const game of GAME_IDS) {
        const t = (_a = totals[game]) !== null && _a !== void 0 ? _a : { created: 0, skipped: 0, failed: 0 };
        console.log(`  ${game.padEnd(16)} created: ${t.created}  skipped: ${t.skipped}  failed: ${t.failed}`);
        totalCreated += t.created;
        totalSkipped += t.skipped;
        totalFailed += t.failed;
    }
    console.log(`\n  ${"TOTAL".padEnd(15)} created: ${totalCreated}  skipped: ${totalSkipped}  failed: ${totalFailed}`);
}
//# sourceMappingURL=backfill.js.map