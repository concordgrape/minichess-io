"use strict";
/**
 * deleteGame.ts — deletes all puzzles in a game's Firestore subcollection.
 *
 * Usage (from functions/):
 *   npx ts-node deleteGame.ts --game=takes
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
const path = __importStar(require("path"));
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
async function main() {
    var _a;
    const game = (_a = process.argv.find((a) => a.startsWith("--game="))) === null || _a === void 0 ? void 0 : _a.split("=")[1];
    if (!game) {
        console.error("Usage: npx ts-node deleteGame.ts --game=<gameId>");
        process.exit(1);
    }
    const col = db.collection("games").doc(game).collection("puzzles");
    const snap = await col.get();
    if (snap.empty) {
        console.log(`No puzzles found for "${game}".`);
        return;
    }
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
//# sourceMappingURL=deleteGame.js.map