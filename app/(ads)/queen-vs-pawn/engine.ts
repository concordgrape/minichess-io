"use client";

import { Chess, type Move } from "chess.js";

const BIG = 1_000_000;

/** Black's non-king material: pawns left, and whether it has promoted. */
function blackState(chess: Chess): { pawns: number; promoted: boolean } {
  let pawns = 0, promoted = false;
  for (const row of chess.board())
    for (const cell of row)
      if (cell && cell.color === "b") {
        if (cell.type === "p") pawns++;
        else if (cell.type !== "k") promoted = true;
      }
  return { pawns, promoted };
}

/** True once White has achieved the goal: the pawn is captured. */
export function pawnCaptured(chess: Chess): boolean {
  const { pawns, promoted } = blackState(chess);
  return pawns === 0 && !promoted;
}

/** True if Black has promoted — the puzzle is failed. */
export function pawnPromoted(chess: Chess): boolean {
  return blackState(chess).promoted;
}

/**
 * Score from White's perspective: White wants to capture the Black pawn
 * before it promotes.
 *   > 0  White forces the pawn's capture within the horizon (bigger = sooner)
 *   = 0  no forced capture (Black holds / draws within horizon)
 *   < 0  Black promotes (goal failed)
 */
function search(chess: Chess, depth: number): number {
  const { pawns, promoted } = blackState(chess);
  if (promoted) return -BIG;
  if (pawns === 0) return BIG;
  if (depth === 0 || chess.isStalemate() || chess.isInsufficientMaterial() || chess.isDraw()) {
    return 0;
  }

  const whiteToMove = chess.turn() === "w";
  let best = whiteToMove ? -Infinity : Infinity;
  for (const m of chess.moves()) {
    chess.move(m);
    let v = search(chess, depth - 1);
    chess.undo();
    if (v > 0) v -= 1; else if (v < 0) v += 1;
    if (whiteToMove) { if (v > best) best = v; if (best >= BIG - 1) break; }
    else { if (v < best) best = v; if (best <= -BIG + 1) break; }
  }
  return best === Infinity || best === -Infinity ? 0 : best;
}

/**
 * Black's best defense: promote if possible, otherwise keep the pawn alive
 * as long as possible (mirror of the White goal-search).
 */
export function bestPawnDefense(fen: string, horizonPlies: number): Move | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true }) as Move[];
  if (moves.length === 0) return null;

  let bestMove = moves[0];
  let bestScore = Infinity; // Black minimizes White's goal score
  for (const m of moves) {
    chess.move(m);
    let v = search(chess, horizonPlies - 1);
    chess.undo();
    if (v > 0) v -= 1; else if (v < 0) v += 1;
    if (v < bestScore) {
      bestScore = v;
      bestMove = m;
      if (bestScore <= -BIG + 1) break; // promotes — best possible for Black
    }
  }
  return bestMove;
}

/** Whether White can force the pawn's capture within `inMoves` full moves. */
export function hasForcedWin(fen: string, inMoves: number): boolean {
  const chess = new Chess(fen);
  return search(chess, inMoves * 2 - 1) > 0;
}
