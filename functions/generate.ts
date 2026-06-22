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

import { generateMatePuzzle } from "./matePuzzleGenerator";
import { generateEndgamePuzzle } from "./endgameGenerator";
import { generatePawnHuntPuzzle } from "./pawnHuntGenerator";
import { generateBoard4x4Puzzle } from "./board4x4Generator";
import { generateTakes, generateSolitaire, generateChessSolitaire } from "./chainCaptureGenerator";

export type Difficulty = "easy" | "medium" | "hard";

export const GAME_IDS = [
  "takes", "solitaire", "check", "smothered", "chess-solitaire",
  "queen-vs-pawn", "king-and-pawn", "rook-endgame", "zugzwang",
  "mate-in-1", "mate-in-2", "mate-in-3",
] as const;
export type GameId = (typeof GAME_IDS)[number];

export function isGameId(s: string): s is GameId {
  return (GAME_IDS as readonly string[]).includes(s);
}

/** Pick a random difficulty with equal 1/3 chance each. */
export function randomDifficulty(): Difficulty {
  const r = Math.random();
  if (r < 1 / 3) return "easy";
  if (r < 2 / 3) return "medium";
  return "hard";
}

export interface GeneratedPuzzle {
  difficulty: Difficulty;
  /** Raw puzzle fields ({ fen } | { board, ...} | { pieces }). */
  data: Record<string, unknown>;
}

/**
 * Generate one puzzle for `game`. `difficulty` is a hint:
 *  - chess/FEN & chain-capture games honour it directly,
 *  - check/smothered derive the final difficulty from the forced-mate depth,
 * so the returned `difficulty` is authoritative.
 */
export function generatePuzzle(game: GameId, difficulty: Difficulty): GeneratedPuzzle {
  switch (game) {
    case "mate-in-1":
    case "mate-in-2":
    case "mate-in-3": {
      const g = generateMatePuzzle(game, difficulty);
      return { difficulty: g.difficulty, data: { fen: g.fen } };
    }
    case "rook-endgame":
    case "king-and-pawn":
    case "zugzwang": {
      const g = generateEndgamePuzzle(game, difficulty);
      return { difficulty: g.difficulty, data: { fen: g.fen } };
    }
    case "queen-vs-pawn": {
      const g = generatePawnHuntPuzzle(difficulty);
      return { difficulty: g.difficulty, data: { fen: g.fen } };
    }
    case "check":
    case "smothered": {
      const g = generateBoard4x4Puzzle(game);
      return { difficulty: g.difficulty, data: { board: g.board } };
    }
    case "takes": {
      const g = generateTakes(difficulty);
      return { difficulty: g.difficulty, data: { pieces: g.data.pieces } };
    }
    case "solitaire": {
      const g = generateSolitaire(difficulty);
      return { difficulty: g.difficulty, data: { board: g.data.board, start: g.data.start } };
    }
    case "chess-solitaire": {
      const g = generateChessSolitaire(difficulty);
      return { difficulty: g.difficulty, data: { pieces: g.data.pieces } };
    }
  }
}

/** Stable signature for de-duplicating puzzles within a batch. */
export function puzzleSignature(game: GameId, data: Record<string, unknown>): string {
  return `${game}:${JSON.stringify(data)}`;
}

/**
 * Firestore rejects directly-nested arrays, so any array-of-arrays field (the
 * 4×4 `board`) is stored as a JSON string. The puzzle API parses it back.
 */
export function serializeForFirestore(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [
      k,
      Array.isArray(v) && v.some(Array.isArray) ? JSON.stringify(v) : v,
    ]),
  );
}
