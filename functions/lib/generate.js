"use strict";
/**
 * generate.ts
 *
 * Single source of truth that routes every game to its puzzle-generation
 * algorithm. Both the daily Cloud Function (index.ts) and the manual seeding
 * script (backfill.ts) call generatePuzzle() so the cron and backfill always
 * produce puzzles the same way.
 *
 * Every generator guarantees the puzzle is completable (solvable / a genuine
 * forced mate) and randomises the position so puzzle IDs never duplicate.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAME_IDS = void 0;
exports.isGameId = isGameId;
exports.randomDifficulty = randomDifficulty;
exports.generatePuzzle = generatePuzzle;
exports.puzzleSignature = puzzleSignature;
exports.serializeForFirestore = serializeForFirestore;
const matePuzzleGenerator_1 = require("./matePuzzleGenerator");
const endgameGenerator_1 = require("./endgameGenerator");
const pawnHuntGenerator_1 = require("./pawnHuntGenerator");
const board4x4Generator_1 = require("./board4x4Generator");
const chainCaptureGenerator_1 = require("./chainCaptureGenerator");
exports.GAME_IDS = [
    "takes", "solitaire", "check", "smothered", "chess-solitaire",
    "queen-vs-pawn", "king-and-pawn", "rook-endgame", "zugzwang",
    "mate-in-1", "mate-in-2", "mate-in-3",
];
function isGameId(s) {
    return exports.GAME_IDS.includes(s);
}
/** Pick a random difficulty with equal 1/3 chance each. */
function randomDifficulty() {
    const r = Math.random();
    if (r < 1 / 3)
        return "easy";
    if (r < 2 / 3)
        return "medium";
    return "hard";
}
/**
 * Generate one puzzle for `game`. `difficulty` is a hint:
 *  - chess/FEN & chain-capture games honour it directly,
 *  - check/smothered derive the final difficulty from the forced-mate depth,
 * so the returned `difficulty` is authoritative.
 */
function generatePuzzle(game, difficulty) {
    switch (game) {
        case "mate-in-1":
        case "mate-in-2":
        case "mate-in-3": {
            const g = (0, matePuzzleGenerator_1.generateMatePuzzle)(game, difficulty);
            return { difficulty: g.difficulty, data: { fen: g.fen } };
        }
        case "rook-endgame":
        case "king-and-pawn":
        case "zugzwang": {
            const g = (0, endgameGenerator_1.generateEndgamePuzzle)(game, difficulty);
            return { difficulty: g.difficulty, data: { fen: g.fen } };
        }
        case "queen-vs-pawn": {
            const g = (0, pawnHuntGenerator_1.generatePawnHuntPuzzle)(difficulty);
            return { difficulty: g.difficulty, data: { fen: g.fen } };
        }
        case "check":
        case "smothered": {
            const g = (0, board4x4Generator_1.generateBoard4x4Puzzle)(game);
            return { difficulty: g.difficulty, data: { board: g.board } };
        }
        case "takes": {
            const g = (0, chainCaptureGenerator_1.generateTakes)(difficulty);
            return { difficulty: g.difficulty, data: { pieces: g.data.pieces } };
        }
        case "solitaire": {
            const g = (0, chainCaptureGenerator_1.generateSolitaire)(difficulty);
            return { difficulty: g.difficulty, data: { board: g.data.board, start: g.data.start } };
        }
        case "chess-solitaire": {
            const g = (0, chainCaptureGenerator_1.generateChessSolitaire)(difficulty);
            return { difficulty: g.difficulty, data: { pieces: g.data.pieces } };
        }
    }
}
/** Stable signature for de-duplicating puzzles within a batch. */
function puzzleSignature(game, data) {
    return `${game}:${JSON.stringify(data)}`;
}
/**
 * Firestore rejects directly-nested arrays, so any array-of-arrays field (the
 * 4×4 `board`) is stored as a JSON string. The puzzle API parses it back.
 */
function serializeForFirestore(data) {
    return Object.fromEntries(Object.entries(data).map(([k, v]) => [
        k,
        Array.isArray(v) && v.some(Array.isArray) ? JSON.stringify(v) : v,
    ]));
}
//# sourceMappingURL=generate.js.map