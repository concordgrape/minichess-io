/**
 * Server-side scoring formulas for each game.
 *
 * All formulas share the same raw-data shape (PuzzleRawData).
 * The difficulty multiplier is applied after the base calculation so
 * hard > medium > easy for any equivalent quality of play.
 *
 * Global score normalization:
 *   normalizedScore = min(1000, round((rawScore / maxHardScore) × 1000))
 *
 * globalScore (per user) = sum of best normalizedScore per game played.
 * Max possible globalScore = 12 games × 1000 = 12 000.
 */

import { readFile } from "fs/promises";
import path from "path";
import type { GameId, Difficulty, GameFormula, PuzzleRawData, ScoreResult } from "./types";

const DIFF: Record<Difficulty, number> = { easy: 1.0, medium: 1.6, hard: 2.8 };

// ─── Per-game formulas ────────────────────────────────────────────────────────
// Inputs:
//   timeSeconds   – wall-clock seconds in the winning attempt
//   undoCount     – undo presses in the winning attempt
//   totalAttempts – 1 = first try, 2 = reset once, etc.
//
// Speed bonus windows are tuned so a competent player solves within them.
// Penalties are capped so a beginner still gets a meaningful score.

export const GAME_FORMULAS: Record<GameId, GameFormula> = {

  // ── Mate in 1 ───────────────────────────────────────────────────────────────
  // timeSeconds → 0-60 speed window (+4 pts/sec saved)
  // undoCount   → -30 pts each, capped at 6
  // totalAttempts → -40 pts each reset beyond 1st, capped at 5 resets
  // Range (hard): ~10 – 1 512 pts
  "mate-in-1": {
    description: "base(300) + speedBonus(max 240 over 60 s) − undoPenalty(30×min(undo,6)) − resetPenalty(40×min(resets,5)) × diffMult",
    maxHardScore: (300 + 240) * 2.8,   // 1 512
    timeBounds: [1, 600],
    difficultyMultipliers: DIFF,
    compute: ({ timeSeconds, undoCount, totalAttempts }, diff) => {
      const speed = Math.max(0, 60 - timeSeconds) * 4;
      const undoP = Math.min(undoCount, 6) * 30;
      const resetP = Math.min(totalAttempts - 1, 5) * 40;
      return Math.max(10, Math.round((300 + speed - undoP - resetP) * DIFF[diff]));
    },
  },

  // ── Mate in 2 ───────────────────────────────────────────────────────────────
  // timeSeconds → 0-120 speed window (+3 pts/sec saved)
  // Range (hard): ~10 – 2 352 pts
  "mate-in-2": {
    description: "base(500) + speedBonus(max 360 over 120 s) − undoPenalty(40×min(undo,6)) − resetPenalty(60×min(resets,5)) × diffMult",
    maxHardScore: (500 + 360) * 2.8,   // 2 408
    timeBounds: [3, 1200],
    difficultyMultipliers: DIFF,
    compute: ({ timeSeconds, undoCount, totalAttempts }, diff) => {
      const speed = Math.max(0, 120 - timeSeconds) * 3;
      const undoP = Math.min(undoCount, 6) * 40;
      const resetP = Math.min(totalAttempts - 1, 5) * 60;
      return Math.max(10, Math.round((500 + speed - undoP - resetP) * DIFF[diff]));
    },
  },

  // ── Mate in 3 ───────────────────────────────────────────────────────────────
  // timeSeconds → 0-240 speed window (+2.5 pts/sec saved)
  // Range (hard): ~10 – 3 920 pts
  "mate-in-3": {
    description: "base(800) + speedBonus(max 600 over 240 s) − undoPenalty(60×min(undo,6)) − resetPenalty(80×min(resets,5)) × diffMult",
    maxHardScore: (800 + 600) * 2.8,   // 3 920
    timeBounds: [5, 2400],
    difficultyMultipliers: DIFF,
    compute: ({ timeSeconds, undoCount, totalAttempts }, diff) => {
      const speed = Math.max(0, 240 - timeSeconds) * 2.5;
      const undoP = Math.min(undoCount, 6) * 60;
      const resetP = Math.min(totalAttempts - 1, 5) * 80;
      return Math.max(10, Math.round((800 + speed - undoP - resetP) * DIFF[diff]));
    },
  },

  // ── Check ───────────────────────────────────────────────────────────────────
  "check": {
    description: "base(400) + speedBonus(max 270 over 90 s) − undoPenalty(30×min(undo,6)) − resetPenalty(50×min(resets,5)) × diffMult",
    maxHardScore: (400 + 270) * 2.8,   // 1 876
    timeBounds: [2, 900],
    difficultyMultipliers: DIFF,
    compute: ({ timeSeconds, undoCount, totalAttempts }, diff) => {
      const speed = Math.max(0, 90 - timeSeconds) * 3;
      const undoP = Math.min(undoCount, 6) * 30;
      const resetP = Math.min(totalAttempts - 1, 5) * 50;
      return Math.max(10, Math.round((400 + speed - undoP - resetP) * DIFF[diff]));
    },
  },

  // ── Smothered ───────────────────────────────────────────────────────────────
  "smothered": {
    description: "base(450) + speedBonus(max 270 over 90 s) − undoPenalty(35×min(undo,6)) − resetPenalty(55×min(resets,5)) × diffMult",
    maxHardScore: (450 + 270) * 2.8,   // 2 016
    timeBounds: [2, 900],
    difficultyMultipliers: DIFF,
    compute: ({ timeSeconds, undoCount, totalAttempts }, diff) => {
      const speed = Math.max(0, 90 - timeSeconds) * 3;
      const undoP = Math.min(undoCount, 6) * 35;
      const resetP = Math.min(totalAttempts - 1, 5) * 55;
      return Math.max(10, Math.round((450 + speed - undoP - resetP) * DIFF[diff]));
    },
  },

  // ── Takes ───────────────────────────────────────────────────────────────────
  "takes": {
    description: "base(350) + speedBonus(max 180 over 60 s) − undoPenalty(25×min(undo,6)) − resetPenalty(40×min(resets,5)) × diffMult",
    maxHardScore: (350 + 180) * 2.8,   // 1 484
    timeBounds: [1, 600],
    difficultyMultipliers: DIFF,
    compute: ({ timeSeconds, undoCount, totalAttempts }, diff) => {
      const speed = Math.max(0, 60 - timeSeconds) * 3;
      const undoP = Math.min(undoCount, 6) * 25;
      const resetP = Math.min(totalAttempts - 1, 5) * 40;
      return Math.max(10, Math.round((350 + speed - undoP - resetP) * DIFF[diff]));
    },
  },

  // ── Solitaire (Chain Capture) ────────────────────────────────────────────────
  "solitaire": {
    description: "base(400) + speedBonus(max 240 over 120 s) − undoPenalty(40×min(undo,5)) − resetPenalty(50×min(resets,5)) × diffMult",
    maxHardScore: (400 + 240) * 2.8,   // 1 792
    timeBounds: [3, 900],
    difficultyMultipliers: DIFF,
    compute: ({ timeSeconds, undoCount, totalAttempts }, diff) => {
      const speed = Math.max(0, 120 - timeSeconds) * 2;
      const undoP = Math.min(undoCount, 5) * 40;
      const resetP = Math.min(totalAttempts - 1, 5) * 50;
      return Math.max(10, Math.round((400 + speed - undoP - resetP) * DIFF[diff]));
    },
  },

  // ── Chess Solitaire ─────────────────────────────────────────────────────────
  "chess-solitaire": {
    description: "base(500) + speedBonus(max 360 over 180 s) − undoPenalty(50×min(undo,5)) − resetPenalty(60×min(resets,5)) × diffMult",
    maxHardScore: (500 + 360) * 2.8,   // 2 408
    timeBounds: [5, 1800],
    difficultyMultipliers: DIFF,
    compute: ({ timeSeconds, undoCount, totalAttempts }, diff) => {
      const speed = Math.max(0, 180 - timeSeconds) * 2;
      const undoP = Math.min(undoCount, 5) * 50;
      const resetP = Math.min(totalAttempts - 1, 5) * 60;
      return Math.max(10, Math.round((500 + speed - undoP - resetP) * DIFF[diff]));
    },
  },

  // ── Queen vs Pawn ───────────────────────────────────────────────────────────
  "queen-vs-pawn": {
    description: "base(450) + speedBonus(max 270 over 90 s) − undoPenalty(35×min(undo,6)) − resetPenalty(55×min(resets,5)) × diffMult",
    maxHardScore: (450 + 270) * 2.8,   // 2 016
    timeBounds: [2, 900],
    difficultyMultipliers: DIFF,
    compute: ({ timeSeconds, undoCount, totalAttempts }, diff) => {
      const speed = Math.max(0, 90 - timeSeconds) * 3;
      const undoP = Math.min(undoCount, 6) * 35;
      const resetP = Math.min(totalAttempts - 1, 5) * 55;
      return Math.max(10, Math.round((450 + speed - undoP - resetP) * DIFF[diff]));
    },
  },

  // ── King and Pawn Endgame ────────────────────────────────────────────────────
  "king-and-pawn": {
    description: "base(500) + speedBonus(max 360 over 120 s) − undoPenalty(40×min(undo,6)) − resetPenalty(60×min(resets,5)) × diffMult",
    maxHardScore: (500 + 360) * 2.8,   // 2 408
    timeBounds: [2, 900],
    difficultyMultipliers: DIFF,
    compute: ({ timeSeconds, undoCount, totalAttempts }, diff) => {
      const speed = Math.max(0, 120 - timeSeconds) * 3;
      const undoP = Math.min(undoCount, 6) * 40;
      const resetP = Math.min(totalAttempts - 1, 5) * 60;
      return Math.max(10, Math.round((500 + speed - undoP - resetP) * DIFF[diff]));
    },
  },

  // ── Rook Endgame ────────────────────────────────────────────────────────────
  "rook-endgame": {
    description: "base(500) + speedBonus(max 360 over 120 s) − undoPenalty(40×min(undo,6)) − resetPenalty(60×min(resets,5)) × diffMult",
    maxHardScore: (500 + 360) * 2.8,   // 2 408
    timeBounds: [2, 900],
    difficultyMultipliers: DIFF,
    compute: ({ timeSeconds, undoCount, totalAttempts }, diff) => {
      const speed = Math.max(0, 120 - timeSeconds) * 3;
      const undoP = Math.min(undoCount, 6) * 40;
      const resetP = Math.min(totalAttempts - 1, 5) * 60;
      return Math.max(10, Math.round((500 + speed - undoP - resetP) * DIFF[diff]));
    },
  },

  // ── Zugzwang ─────────────────────────────────────────────────────────────────
  "zugzwang": {
    description: "base(600) + speedBonus(max 360 over 120 s) − undoPenalty(50×min(undo,6)) − resetPenalty(70×min(resets,5)) × diffMult",
    maxHardScore: (600 + 360) * 2.8,   // 2 688
    timeBounds: [2, 900],
    difficultyMultipliers: DIFF,
    compute: ({ timeSeconds, undoCount, totalAttempts }, diff) => {
      const speed = Math.max(0, 120 - timeSeconds) * 3;
      const undoP = Math.min(undoCount, 6) * 50;
      const resetP = Math.min(totalAttempts - 1, 5) * 70;
      return Math.max(10, Math.round((600 + speed - undoP - resetP) * DIFF[diff]));
    },
  },

  // ── Survival ────────────────────────────────────────────────────────────────
  // totalAttempts = captures scored (repurposed field)
  // Score = captures × 10. Normalized against 50 captures (500 pts) as ceiling.
  "survival": {
    description: "captures × 10; normalized against 500 (50 captures)",
    maxHardScore: 500,
    timeBounds: [0, 7200],
    difficultyMultipliers: DIFF,
    compute: ({ totalAttempts }) => Math.max(0, totalAttempts * 10),
  },
};

// ─── Helpers (server-side only) ───────────────────────────────────────────────

export function normalizeScore(rawScore: number, gameId: GameId): number {
  return Math.min(1000, Math.round((rawScore / GAME_FORMULAS[gameId].maxHardScore) * 1000));
}

/** Load difficulty for a puzzle from the public/games JSON (server-side only). */
export async function getPuzzleDifficulty(
  gameId: GameId,
  puzzleId: number
): Promise<Difficulty | null> {
  const filePath = path.join(process.cwd(), "public", "games", `${gameId}.json`);
  const raw = await readFile(filePath, "utf-8");
  const data: { id: number; difficulty: Difficulty } | Array<{ id: number; difficulty: Difficulty }> = JSON.parse(raw);
  const puzzles = Array.isArray(data) ? data : [data];
  return puzzles.find((p) => p.id === puzzleId)?.difficulty ?? null;
}

export function computeScore(
  data: PuzzleRawData,
  gameId: GameId,
  difficulty: Difficulty
): ScoreResult {
  const formula = GAME_FORMULAS[gameId];
  const score = formula.compute(data, difficulty);
  const normalizedScore = normalizeScore(score, gameId);
  return { score, normalizedScore, difficulty };
}
