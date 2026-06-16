"use client";

import { Chess, type Move } from "chess.js";

const MATE = 1_000_000;

/**
 * Score a position from `attacker`'s perspective using a pure mate search
 * (material is irrelevant — only forced mate matters).
 *
 *   > 0  attacker can force checkmate within the horizon (bigger = sooner)
 *   = 0  no forced mate within the horizon (defender survives)
 *   < 0  attacker gets mated (should not happen in well-formed puzzles)
 *
 * The magnitude decays by 1 per ply so the attacker prefers the quickest mate
 * and the defender prefers the longest possible resistance.
 */
function search(chess: Chess, depth: number, attacker: "w" | "b"): number {
  if (chess.isCheckmate()) {
    // The side to move has just been checkmated.
    return chess.turn() === attacker ? -MATE : MATE;
  }
  if (
    depth === 0 ||
    chess.isStalemate() ||
    chess.isInsufficientMaterial() ||
    chess.isDraw()
  ) {
    return 0;
  }

  const maximizing = chess.turn() === attacker;
  let best = maximizing ? -Infinity : Infinity;

  for (const m of chess.moves()) {
    chess.move(m);
    let v = search(chess, depth - 1, attacker);
    chess.undo();
    if (v > 0) v -= 1;
    else if (v < 0) v += 1;

    if (maximizing) {
      if (v > best) best = v;
      // Immediate mate available — cannot do better.
      if (best >= MATE - 1) break;
    } else {
      if (v < best) best = v;
      // Defender escapes mate entirely — cannot do better than that.
      if (best <= 0) break;
    }
  }
  return best === Infinity || best === -Infinity ? 0 : best;
}

/**
 * The defender's best reply: the move that avoids checkmate if possible,
 * otherwise delays it as long as possible. `horizonPlies` bounds the search.
 */
export function bestDefense(fen: string, horizonPlies: number): Move | null {
  const chess = new Chess(fen);
  const defender = chess.turn();
  const attacker = defender === "w" ? "b" : "w";
  const moves = chess.moves({ verbose: true }) as Move[];
  if (moves.length === 0) return null;

  let bestMove = moves[0];
  let bestScore = Infinity; // defender minimizes the attacker's score
  for (const m of moves) {
    chess.move(m);
    let v = search(chess, horizonPlies - 1, attacker);
    chess.undo();
    if (v > 0) v -= 1;
    else if (v < 0) v += 1;
    if (v < bestScore) {
      bestScore = v;
      bestMove = m;
      if (bestScore <= 0) break; // fully escapes mate — optimal
    }
  }
  return bestMove;
}

/** Whether the side to move can force checkmate within `mateIn` full moves. */
export function hasForcedMate(fen: string, mateIn: number): boolean {
  const chess = new Chess(fen);
  return search(chess, mateIn * 2 - 1, chess.turn()) > 0;
}
