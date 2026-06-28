"use strict";
/**
 * chessSearch.ts
 *
 * Standalone ports of the two front-end chess engines so the generator can
 * verify a puzzle is solvable with EXACTLY the same logic the player faces:
 *
 *   - mate search        ← app/mate/engine.ts        (forced checkmate)
 *   - pawn-hunt search    ← app/queen-vs-pawn/engine.ts (force capture a pawn)
 *
 * Keeping these in lock-step with the app guarantees every generated FEN that
 * passes here is actually winnable in the browser.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasForcedMate = hasForcedMate;
exports.exactlyMateIn = exactlyMateIn;
exports.matingFirstMoves = matingFirstMoves;
exports.hasForcedPawnWin = hasForcedPawnWin;
exports.sq = sq;
exports.fileOf = fileOf;
exports.rankOf = rankOf;
exports.randInt = randInt;
exports.shuffle = shuffle;
exports.pick = pick;
exports.chebyshev = chebyshev;
exports.boardToFen = boardToFen;
exports.loadPlayable = loadPlayable;
const chess_js_1 = require("chess.js");
// ─── Forced-mate search (mirror of app/mate/engine.ts) ──────────────────────────
// Transposition table — scoped per top-level search (cleared each call).
let TT = null;
// Optional node budget so a single (usually "no mate") verification can't run
// away. When exceeded the search aborts via this sentinel.
const BUDGET_EXCEEDED = Symbol("budget");
let nodeCount = 0;
let nodeBudget = Infinity;
/**
 * Boolean forced-mate search: can `attacker` force checkmate within `depth`
 * plies? Short-circuits hard (the attacker stops at the first mating move, the
 * defender at the first escape), which keeps even mate-in-3 verification fast.
 */
function canForceMate(chess, depth, attacker) {
    if (++nodeCount > nodeBudget)
        throw BUDGET_EXCEEDED;
    if (chess.isCheckmate())
        return chess.turn() !== attacker; // side to move is mated
    if (depth === 0 || chess.isStalemate() || chess.isInsufficientMaterial() || chess.isDraw()) {
        return false;
    }
    const key = TT ? `${chess.fen()}|${depth}` : "";
    if (TT && key && TT.has(key))
        return TT.get(key);
    const maximizing = chess.turn() === attacker;
    let result;
    if (maximizing) {
        // Try captures/checks first (more likely to mate) so we short-circuit sooner.
        const moves = chess.moves({ verbose: true });
        moves.sort((a, b) => (/[cep]/.test(b.flags) ? 1 : 0) - (/[cep]/.test(a.flags) ? 1 : 0));
        result = false;
        for (const m of moves) {
            chess.move(m);
            const r = canForceMate(chess, depth - 1, attacker);
            chess.undo();
            if (r) {
                result = true;
                break;
            }
        }
    }
    else {
        result = true;
        for (const m of chess.moves()) {
            chess.move(m);
            const r = canForceMate(chess, depth - 1, attacker);
            chess.undo();
            if (!r) {
                result = false;
                break;
            }
        }
    }
    if (TT && key)
        TT.set(key, result);
    return result;
}
/**
 * Whether the side to move can force checkmate within `mateIn` full moves.
 * Returns null if the optional `budget` (node count) is exceeded before a
 * conclusion is reached.
 */
function hasForcedMate(fen, mateIn, budget = Infinity) {
    const chess = new chess_js_1.Chess(fen);
    TT = new Map();
    nodeCount = 0;
    nodeBudget = budget;
    try {
        return canForceMate(chess, mateIn * 2 - 1, chess.turn());
    }
    catch (e) {
        if (e === BUDGET_EXCEEDED)
            return null;
        throw e;
    }
    finally {
        TT = null;
        nodeBudget = Infinity;
    }
}
// Node budget per verification — true forced mates prove themselves well under
// this; only pathological "no mate" disproofs ever hit it (and are rejected).
const MATE_BUDGET = 60000;
/**
 * Whether the side to move forces mate in EXACTLY `n` moves (no shorter mate).
 * Budgeted so a single check is bounded; an inconclusive (budget-hit) result is
 * treated as "not exactly n" so only confirmed puzzles are ever accepted.
 */
function exactlyMateIn(fen, n) {
    if (n >= 2 && hasForcedMate(fen, n - 1, MATE_BUDGET) !== false)
        return false;
    return hasForcedMate(fen, n, MATE_BUDGET) === true;
}
/**
 * The set of first moves (SAN) that lead to a forced mate within `n` moves.
 * Used to inspect a solution — e.g. the "quiet move" requirement of zugzwang.
 */
function matingFirstMoves(fen, n) {
    const chess = new chess_js_1.Chess(fen);
    const attacker = chess.turn();
    TT = new Map();
    const winners = [];
    for (const m of chess.moves({ verbose: true })) {
        chess.move(m);
        // After our move the defender is to move; they must be mated within n-1 of OUR moves.
        const ok = canForceMate(chess, (n - 1) * 2, attacker);
        chess.undo();
        if (ok)
            winners.push(m.san);
    }
    TT = null;
    return winners;
}
// ─── Pawn-hunt search (mirror of app/queen-vs-pawn/engine.ts) ────────────────────
const BIG = 1000000;
function blackState(chess) {
    let pawns = 0, promoted = false;
    for (const row of chess.board())
        for (const cell of row)
            if (cell && cell.color === "b") {
                if (cell.type === "p")
                    pawns++;
                else if (cell.type !== "k")
                    promoted = true;
            }
    return { pawns, promoted };
}
function pawnSearch(chess, depth) {
    const { pawns, promoted } = blackState(chess);
    if (promoted)
        return -BIG;
    if (pawns === 0)
        return BIG;
    if (depth === 0 || chess.isStalemate() || chess.isInsufficientMaterial() || chess.isDraw()) {
        return 0;
    }
    const whiteToMove = chess.turn() === "w";
    let best = whiteToMove ? -Infinity : Infinity;
    for (const m of chess.moves()) {
        chess.move(m);
        let v = pawnSearch(chess, depth - 1);
        chess.undo();
        if (v > 0)
            v -= 1;
        else if (v < 0)
            v += 1;
        if (whiteToMove) {
            if (v > best)
                best = v;
            if (best >= BIG - 1)
                break;
        }
        else {
            if (v < best)
                best = v;
            if (best <= -BIG + 1)
                break;
        }
    }
    return best === Infinity || best === -Infinity ? 0 : best;
}
/** Whether White can force the capture of the Black pawn within `inMoves` moves. */
function hasForcedPawnWin(fen, inMoves) {
    const chess = new chess_js_1.Chess(fen);
    return pawnSearch(chess, inMoves * 2 - 1) > 0;
}
/** 0-63 square index helpers (a1 = 0 ... h8 = 63 is NOT used; we use rank/file directly). */
function sq(file, rank) { return rank * 8 + file; }
function fileOf(s) { return s % 8; }
function rankOf(s) { return Math.floor(s / 8); }
function randInt(n) { return Math.floor(Math.random() * n); }
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = randInt(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
function pick(arr) { return arr[randInt(arr.length)]; }
function chebyshev(a, b) {
    return Math.max(Math.abs(fileOf(a) - fileOf(b)), Math.abs(rankOf(a) - rankOf(b)));
}
/** Build a "w - - 0 1" FEN from a 64-cell board (index = rank*8+file, rank 0 = rank 1). */
function boardToFen(board, turn = "w") {
    let fen = "";
    for (let r = 7; r >= 0; r--) {
        let empty = 0;
        for (let f = 0; f < 8; f++) {
            const piece = board[sq(f, r)];
            if (!piece) {
                empty++;
                continue;
            }
            if (empty) {
                fen += empty;
                empty = 0;
            }
            fen += piece;
        }
        if (empty)
            fen += empty;
        if (r > 0)
            fen += "/";
    }
    return `${fen} ${turn} - - 0 1`;
}
/**
 * Validate a generated FEN is a legal, non-terminal starting position for the
 * solver (White to move, nobody already mated/stalemated, White not in check).
 * Returns a loaded Chess instance or null.
 */
function loadPlayable(fen) {
    let chess;
    try {
        chess = new chess_js_1.Chess(fen);
    }
    catch (_a) {
        return null;
    }
    if (chess.isGameOver())
        return null;
    if (chess.isCheck())
        return null; // side to move (White) already in check
    return chess;
}
//# sourceMappingURL=chessSearch.js.map