"use strict";
/**
 * matePuzzleGenerator.ts
 *
 * Generates standard-chess positions with a forced mate in EXACTLY N moves
 * (White to move) for the mate-in-1 / mate-in-2 / mate-in-3 games.
 *
 * Correctness is guaranteed by chessSearch.exactlyMateIn — the same forced-mate
 * search the browser uses (app/mate/engine.ts), so every emitted FEN is winnable
 * in exactly the advertised number of moves.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMatePuzzle = generateMatePuzzle;
const chessSearch_1 = require("./chessSearch");
const MATE_DEPTH = {
    "mate-in-1": 1,
    "mate-in-2": 2,
    "mate-in-3": 3,
};
// White attacking material by difficulty (excludes the white king).
// More / weaker pieces => busier board => harder to spot the solution.
// Deeper mates lean on Q/R material: it keeps the verification search fast and
// short mates dense, while the difficulty label is cosmetic (the mate length is
// fixed by the game).
const PIECE_SETS = {
    "mate-in-1": {
        easy: [["Q"], ["Q", "R"], ["R", "R"]],
        medium: [["Q", "B"], ["Q", "N"], ["R", "B"], ["R", "N"]],
        hard: [["Q", "B", "N"], ["R", "R", "B"], ["R", "B", "N"], ["B", "B", "N"]],
    },
    "mate-in-2": {
        easy: [["Q"], ["Q", "R"], ["R", "R"]],
        medium: [["Q", "B"], ["Q", "N"], ["R", "B"], ["R", "N"]],
        hard: [["Q", "N"], ["R", "B"], ["R", "N"], ["Q", "B"]],
    },
    // K+R vs k: a rook mates in 2–3 moves, so exact mate-in-3 is dense and
    // verification stays fast (a lone queen mostly mates in 2, which makes exact
    // mate-in-3 rare and slow to find). Variety comes from the king/piece squares
    // and the occasional black pawn defender. Difficulty is cosmetic here — the
    // mate length is fixed by the game.
    "mate-in-3": {
        easy: [["R"]],
        medium: [["R"]],
        hard: [["R"]],
    },
};
// Optional Black defenders (besides the king) — give the defender resources.
const BLACK_DEFENDERS = {
    easy: [[]],
    medium: [[], ["p"], ["p", "p"]],
    hard: [["p"], ["p", "p"], ["p", "n"]],
};
/** Random square biased toward the edge/corner where the defender is mated. */
function edgeBiasedSquare() {
    // Pick a rank/file that leans toward the rim.
    const bias = () => (0, chessSearch_1.pick)([0, 0, 1, 1, 2, 5, 6, 6, 7, 7]);
    return (0, chessSearch_1.sq)(bias(), bias());
}
/** A square strictly on the rim (file or rank 0/7) — where short mates live. */
function strictEdgeSquare() {
    if (Math.random() < 0.5) {
        return (0, chessSearch_1.sq)((0, chessSearch_1.pick)([0, 7]), (0, chessSearch_1.randInt)(8));
    }
    return (0, chessSearch_1.sq)((0, chessSearch_1.randInt)(8), (0, chessSearch_1.pick)([0, 7]));
}
/** A random square within `off` of `center` (Chebyshev). */
function nearSquare(center, off) {
    const df = (0, chessSearch_1.randInt)(off * 2 + 1) - off;
    const dr = (0, chessSearch_1.randInt)(off * 2 + 1) - off;
    return (0, chessSearch_1.sq)(Math.min(7, Math.max(0, (0, chessSearch_1.fileOf)(center) + df)), Math.min(7, Math.max(0, (0, chessSearch_1.rankOf)(center) + dr)));
}
function pawnRankOk(piece, s) {
    if (piece !== "P" && piece !== "p")
        return true;
    const r = (0, chessSearch_1.rankOf)(s);
    return r >= 1 && r <= 6; // pawns never on rank 1 or 8
}
function tryBuild(white, blackExtra, depth) {
    const board = new Array(64).fill(null);
    const used = new Set();
    const place = (piece, chooser, ok) => {
        for (let t = 0; t < 80; t++) {
            const s = chooser();
            if (s < 0 || s > 63 || used.has(s) || !pawnRankOk(piece, s))
                continue;
            if (ok && !ok(s))
                continue;
            board[s] = piece;
            used.add(s);
            return true;
        }
        return false;
    };
    // Black king on the rim (strict for deeper mates — that's where they live).
    if (!place("k", depth >= 2 ? strictEdgeSquare : edgeBiasedSquare))
        return null;
    const bk = [...used][0];
    // White king kept near enough to support the mate (lone major pieces need the
    // king's help), but never adjacent to the black king.
    const maxOff = depth >= 2 ? 3 : 7;
    if (!place("K", () => nearSquare(bk, maxOff), (s) => (0, chessSearch_1.chebyshev)(s, bk) > 1))
        return null;
    // White attackers — within striking distance of the black king. Deeper mates
    // keep them close (far pieces just yield slow "no mate" rejects).
    for (const piece of white) {
        const chooser = depth >= 2
            ? () => nearSquare(bk, 3)
            : () => (Math.random() < 0.7 ? nearSquare(bk, 3) : (0, chessSearch_1.randInt)(64));
        if (!place(piece, chooser))
            return null;
    }
    // Black defenders, placed near the black king.
    for (const piece of blackExtra) {
        place(piece, () => nearSquare(bk, 1));
    }
    return (0, chessSearch_1.boardToFen)(board, "w");
}
const MAX_ATTEMPTS = 4000;
const FALLBACKS = {
    "mate-in-1": "6k1/5ppp/8/8/8/8/5Q2/6K1 w - - 0 1",
    "mate-in-2": "6k1/6pp/8/8/8/8/8/R3R1K1 w - - 0 1",
    "mate-in-3": "7k/8/8/8/8/8/6Q1/4R1K1 w - - 0 1",
};
function generateMatePuzzle(gameId, difficulty) {
    const depth = MATE_DEPTH[gameId];
    const whiteSets = PIECE_SETS[gameId][difficulty];
    // Movable black defenders explode the deep mate-in-3 search (and make exact
    // mate-in-3 rare), so only the shallow games use them.
    const defenderSets = depth >= 3 ? [[]] : BLACK_DEFENDERS[difficulty];
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const white = [...(0, chessSearch_1.pick)(whiteSets)];
        const blackExtra = [...(0, chessSearch_1.pick)(defenderSets)];
        const fen = tryBuild(white, blackExtra, depth);
        if (!fen)
            continue;
        if (!(0, chessSearch_1.loadPlayable)(fen))
            continue;
        if ((0, chessSearch_1.exactlyMateIn)(fen, depth)) {
            return { fen, difficulty };
        }
    }
    // Should essentially never happen given the search space; keep the script alive.
    return { fen: FALLBACKS[gameId], difficulty };
}
//# sourceMappingURL=matePuzzleGenerator.js.map