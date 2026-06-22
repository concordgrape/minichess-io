"use strict";
/**
 * puzzleBanks.ts
 *
 * All puzzle data organized by game and difficulty.
 * The daily generator picks one puzzle per game using these banks.
 * Add more puzzles to expand variety.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MATE_IN_3_BANK = exports.MATE_IN_2_BANK = exports.MATE_IN_1_BANK = exports.ZUGZWANG_BANK = exports.ROOK_ENDGAME_BANK = exports.KING_AND_PAWN_BANK = exports.QUEEN_VS_PAWN_BANK = exports.CHESS_SOLITAIRE_BANK = exports.SMOTHERED_BANK = exports.CHECK_BANK = exports.SOLITAIRE_BANK = exports.TAKES_BANK = void 0;
exports.TAKES_BANK = {
    easy: [
        { pieces: [{ id: "n1", type: "n", row: 0, col: 0 }, { id: "b1", type: "b", row: 0, col: 3 }, { id: "p1", type: "p", row: 1, col: 2 }, { id: "r1", type: "r", row: 2, col: 0 }, { id: "p2", type: "p", row: 2, col: 1 }, { id: "p3", type: "p", row: 3, col: 0 }, { id: "k1", type: "k", row: 3, col: 1 }, { id: "p4", type: "p", row: 3, col: 2 }] },
    ],
    medium: [
        { pieces: [{ id: "q1", type: "q", row: 0, col: 0 }, { id: "p1", type: "p", row: 0, col: 2 }, { id: "n1", type: "n", row: 1, col: 0 }, { id: "b1", type: "b", row: 2, col: 1 }, { id: "p2", type: "p", row: 2, col: 3 }, { id: "k1", type: "k", row: 3, col: 3 }] },
        { pieces: [{ id: "r1", type: "r", row: 0, col: 1 }, { id: "b1", type: "b", row: 0, col: 3 }, { id: "p1", type: "p", row: 1, col: 2 }, { id: "n1", type: "n", row: 2, col: 0 }, { id: "p2", type: "p", row: 3, col: 1 }, { id: "k1", type: "k", row: 3, col: 2 }] },
    ],
    hard: [
        { pieces: [{ id: "r1", type: "r", row: 0, col: 0 }, { id: "b1", type: "b", row: 0, col: 2 }, { id: "p1", type: "p", row: 1, col: 1 }, { id: "n1", type: "n", row: 1, col: 3 }, { id: "p2", type: "p", row: 2, col: 2 }, { id: "k1", type: "k", row: 3, col: 2 }] },
    ],
};
exports.SOLITAIRE_BANK = {
    easy: [
        { board: [["r", null, null, "p"], [null, null, "n", null], [null, null, null, null], [null, null, null, "b"]], start: { row: 0, col: 0 } },
        { board: [[null, "p", null, "r"], ["n", null, null, null], [null, null, "p", null], [null, "b", null, null]], start: { row: 0, col: 3 } },
    ],
    medium: [
        { board: [[null, "n", null, null], [null, "r", null, null], [null, null, "p", null], [null, "b", null, "q"]], start: { row: 3, col: 3 } },
        { board: [[null, null, "k", null], [null, null, "r", null], [null, "b", null, null], [null, null, null, "n"]], start: { row: 3, col: 3 } },
    ],
    hard: [
        { board: [[null, "b", null, null], [null, null, "n", null], [null, null, null, null], [null, "r", "q", "k"]], start: { row: 3, col: 3 } },
    ],
};
exports.CHECK_BANK = {
    easy: [
        { board: [[null, "Q", null, null], [null, null, null, null], [null, null, null, "k"], ["R", null, null, null]] },
        { board: [[null, null, null, null], [null, null, null, null], ["k", null, null, "Q"], [null, null, "R", null]] },
    ],
    medium: [
        { board: [[null, null, null, null], [null, null, "N", null], [null, null, null, "Q"], ["k", null, null, null]] },
        { board: [[null, null, null, null], [null, null, null, null], [null, "R", null, null], ["k", null, "Q", null]] },
    ],
    hard: [
        { board: [[null, null, null, null], ["B", null, null, null], [null, null, "R", null], ["k", null, null, "Q"]] },
    ],
};
exports.SMOTHERED_BANK = {
    easy: [
        { board: [[null, null, null, null], [null, null, null, null], ["p", "k", "p", null], ["N", "Q", null, null]] },
        { board: [["k", "p", null, null], ["p", null, null, null], [null, null, "Q", null], [null, null, null, "N"]] },
    ],
    medium: [
        { board: [[null, null, null, null], [null, null, null, null], [null, "p", "k", "r"], [null, "Q", "N", null]] },
        { board: [[null, null, null, null], [null, null, null, null], ["p", "k", "p", null], [null, "N", null, "Q"]] },
    ],
    hard: [
        { board: [[null, null, null, null], [null, null, "p", "k"], [null, null, "p", null], [null, "Q", null, "N"]] },
    ],
};
exports.CHESS_SOLITAIRE_BANK = {
    easy: [
        { pieces: [{ type: "P", color: "w", row: 3, col: 4 }, { type: "N", color: "b", row: 5, col: 3 }, { type: "B", color: "w", row: 5, col: 2 }, { type: "R", color: "b", row: 7, col: 4 }, { type: "Q", color: "w", row: 0, col: 7 }] },
        { pieces: [{ type: "R", color: "w", row: 4, col: 0 }, { type: "B", color: "b", row: 2, col: 2 }, { type: "Q", color: "w", row: 0, col: 0 }, { type: "N", color: "b", row: 6, col: 1 }] },
        { pieces: [{ type: "R", color: "w", row: 7, col: 0 }, { type: "P", color: "b", row: 5, col: 0 }, { type: "Q", color: "w", row: 5, col: 4 }, { type: "B", color: "b", row: 3, col: 2 }, { type: "N", color: "w", row: 1, col: 1 }] },
    ],
    medium: [
        { pieces: [{ type: "N", color: "b", row: 1, col: 1 }, { type: "P", color: "w", row: 1, col: 5 }, { type: "R", color: "w", row: 2, col: 2 }, { type: "B", color: "b", row: 2, col: 6 }, { type: "N", color: "w", row: 3, col: 3 }, { type: "Q", color: "b", row: 3, col: 7 }, { type: "P", color: "b", row: 4, col: 0 }, { type: "N", color: "b", row: 4, col: 4 }, { type: "B", color: "w", row: 5, col: 1 }, { type: "R", color: "b", row: 5, col: 5 }, { type: "N", color: "w", row: 6, col: 2 }, { type: "P", color: "w", row: 6, col: 6 }, { type: "K", color: "b", row: 7, col: 3 }] },
        { pieces: [{ type: "Q", color: "w", row: 1, col: 5 }, { type: "Q", color: "b", row: 3, col: 4 }, { type: "R", color: "w", row: 7, col: 7 }, { type: "N", color: "b", row: 4, col: 5 }, { type: "B", color: "w", row: 6, col: 1 }, { type: "B", color: "b", row: 4, col: 3 }, { type: "P", color: "w", row: 6, col: 2 }, { type: "P", color: "b", row: 0, col: 7 }, { type: "K", color: "b", row: 3, col: 7 }] },
    ],
    hard: [
        { pieces: [{ type: "Q", color: "w", row: 7, col: 5 }, { type: "R", color: "b", row: 0, col: 2 }, { type: "N", color: "w", row: 3, col: 4 }, { type: "B", color: "b", row: 6, col: 3 }, { type: "P", color: "w", row: 0, col: 0 }, { type: "P", color: "b", row: 6, col: 6 }, { type: "K", color: "b", row: 5, col: 3 }] },
        { pieces: [{ type: "Q", color: "w", row: 2, col: 0 }, { type: "R", color: "b", row: 2, col: 4 }, { type: "N", color: "w", row: 7, col: 5 }, { type: "B", color: "b", row: 1, col: 7 }, { type: "P", color: "w", row: 1, col: 6 }, { type: "P", color: "b", row: 5, col: 4 }, { type: "K", color: "b", row: 1, col: 4 }] },
    ],
};
exports.QUEEN_VS_PAWN_BANK = {
    easy: [],
    medium: [
        { fen: "8/8/8/8/Q7/K7/1p6/k7 w - - 0 1" },
        { fen: "8/8/8/8/7Q/7K/6p1/7k w - - 0 1" },
    ],
    hard: [
        { fen: "8/2Q5/8/8/8/K7/1p6/k7 w - - 0 1" },
    ],
};
exports.KING_AND_PAWN_BANK = {
    easy: [],
    medium: [
        { fen: "8/5KPk/8/8/8/8/8/8 w - - 0 1" },
    ],
    hard: [],
};
exports.ROOK_ENDGAME_BANK = {
    easy: [],
    medium: [
        { fen: "7k/8/5K2/8/8/8/8/2R5 w - - 0 1" },
    ],
    hard: [],
};
exports.ZUGZWANG_BANK = {
    easy: [],
    medium: [],
    hard: [
        { fen: "7k/8/5K2/8/8/8/8/5Q2 w - - 0 1" },
    ],
};
exports.MATE_IN_1_BANK = {
    easy: [
        { fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1" },
        { fen: "6k1/5ppp/8/8/8/8/8/3Q2K1 w - - 0 1" },
        { fen: "6rk/6pp/7N/8/8/8/8/6K1 w - - 0 1" },
    ],
    medium: [
        { fen: "7k/8/6K1/5Q2/8/8/8/8 w - - 0 1" },
        { fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1" },
        { fen: "7k/8/6K1/8/8/8/8/R7 w - - 0 1" },
    ],
    hard: [],
};
exports.MATE_IN_2_BANK = {
    easy: [
        { fen: "7k/6R1/8/8/8/8/8/R6K w - - 0 1" },
    ],
    medium: [
        { fen: "7k/8/5K2/8/1Q6/8/8/8 w - - 0 1" },
        { fen: "7k/8/5K2/8/8/8/8/R7 w - - 0 1" },
        { fen: "7k/8/4K3/8/8/8/8/Q7 w - - 0 1" },
    ],
    hard: [
        { fen: "7k/8/4K3/8/8/8/8/R7 w - - 0 1" },
        { fen: "k7/8/2K5/8/8/8/8/1R6 w - - 0 1" },
    ],
};
exports.MATE_IN_3_BANK = {
    easy: [],
    medium: [
        { fen: "7k/8/8/4K3/8/8/8/1Q6 w - - 0 1" },
        { fen: "6k1/8/8/4K3/8/8/8/Q7 w - - 0 1" },
    ],
    hard: [
        { fen: "7k/8/8/4K3/8/8/8/R7 w - - 0 1" },
        { fen: "k7/8/8/3K4/8/8/8/Q7 w - - 0 1" },
        { fen: "k7/8/8/2K5/8/8/8/1R6 w - - 0 1" },
    ],
};
//# sourceMappingURL=puzzleBanks.js.map