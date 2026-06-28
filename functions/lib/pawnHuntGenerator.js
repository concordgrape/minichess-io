"use strict";
/**
 * pawnHuntGenerator.ts
 *
 * Queen-vs-Pawn puzzles: White K + Q must capture a Black K + P's pawn within
 * two moves, before it promotes (front-end winIn = 2).
 *
 * Solvability is verified with chessSearch.hasForcedPawnWin — the same search
 * the browser uses (app/queen-vs-pawn/engine.ts). Difficulty controls how
 * advanced the pawn is and whether an immediate capture exists:
 *
 *   easy   — pawn far from promotion, often capturable at once
 *   medium — pawn on the 3rd rank, needs a setup move
 *   hard   — pawn one step from queening; no immediate capture, precise 2-mover
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePawnHuntPuzzle = generatePawnHuntPuzzle;
const chessSearch_1 = require("./chessSearch");
function kingsOk(a, b) {
    return Math.max(Math.abs((0, chessSearch_1.fileOf)(a) - (0, chessSearch_1.fileOf)(b)), Math.abs((0, chessSearch_1.rankOf)(a) - (0, chessSearch_1.rankOf)(b))) > 1;
}
// Black pawn marches toward rank 1 (index 0). "About to promote" => rank index 1.
const PAWN_RANK = {
    easy: [3, 4],
    medium: [2, 3],
    hard: [1],
};
function near(center, spread) {
    const df = (0, chessSearch_1.randInt)(spread * 2 + 1) - spread;
    const dr = (0, chessSearch_1.randInt)(spread * 2 + 1) - spread;
    return (0, chessSearch_1.sq)(Math.min(7, Math.max(0, (0, chessSearch_1.fileOf)(center) + df)), Math.min(7, Math.max(0, (0, chessSearch_1.rankOf)(center) + dr)));
}
function build(difficulty) {
    const board = new Array(64).fill(null);
    const used = new Set();
    // Black pawn.
    const pf = (0, chessSearch_1.randInt)(8);
    const pr = (0, chessSearch_1.pick)(PAWN_RANK[difficulty]);
    const ps = (0, chessSearch_1.sq)(pf, pr);
    board[ps] = "p";
    used.add(ps);
    // Black king near its pawn (defends / shields it).
    let bk = -1;
    for (let t = 0; t < 60; t++) {
        const s = near(ps, 2);
        if (!used.has(s)) {
            bk = s;
            break;
        }
    }
    if (bk < 0)
        return null;
    board[bk] = "k";
    used.add(bk);
    // White queen, biased toward the pawn so a forced win is plausible.
    let wq = -1;
    for (let t = 0; t < 60; t++) {
        const s = Math.random() < 0.7 ? near(ps, 3) : (0, chessSearch_1.randInt)(64);
        if (!used.has(s)) {
            wq = s;
            break;
        }
    }
    if (wq < 0)
        return null;
    board[wq] = "Q";
    used.add(wq);
    // White king, not adjacent to the black king.
    let wk = -1;
    for (let t = 0; t < 80; t++) {
        const s = (0, chessSearch_1.randInt)(64);
        if (used.has(s) || !kingsOk(s, bk))
            continue;
        wk = s;
        break;
    }
    if (wk < 0)
        return null;
    board[wk] = "K";
    used.add(wk);
    return (0, chessSearch_1.boardToFen)(board, "w");
}
const MAX_ATTEMPTS = 20000;
const FALLBACKS = {
    easy: "8/8/8/3Q4/8/8/3p4/3k3K w - - 0 1",
    medium: "8/8/8/8/Q7/K7/1p6/k7 w - - 0 1",
    hard: "8/8/8/8/Q7/K7/1p6/k7 w - - 0 1",
};
function generatePawnHuntPuzzle(difficulty) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const fen = build(difficulty);
        if (!fen || !(0, chessSearch_1.loadPlayable)(fen))
            continue;
        if (!(0, chessSearch_1.hasForcedPawnWin)(fen, 2))
            continue;
        // Hard puzzles must not allow an immediate (one-move) capture.
        if (difficulty === "hard" && (0, chessSearch_1.hasForcedPawnWin)(fen, 1))
            continue;
        // Easy puzzles should be gentle: prefer an immediate capture available.
        if (difficulty === "easy" && !(0, chessSearch_1.hasForcedPawnWin)(fen, 1))
            continue;
        return { fen, difficulty };
    }
    return { fen: FALLBACKS[difficulty], difficulty };
}
//# sourceMappingURL=pawnHuntGenerator.js.map