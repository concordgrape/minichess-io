export type GameId =
  | "mate-in-1" | "mate-in-2" | "mate-in-3"
  | "check" | "smothered" | "takes"
  | "solitaire" | "chess-solitaire"
  | "queen-vs-pawn" | "king-and-pawn" | "rook-endgame" | "zugzwang"
  | "survival";

export type Difficulty = "easy" | "medium" | "hard";

/**
 * Raw game data submitted by the client.
 * The server ignores any client-computed score and recomputes from these fields.
 *
 * timeSeconds    – wall-clock seconds in the final (winning) attempt
 * undoCount      – undo actions used in the final attempt
 * totalAttempts  – 1 = solved first try, 2 = reset once before solving, etc.
 */
export interface PuzzleRawData {
  timeSeconds: number;
  undoCount: number;
  totalAttempts: number;
}

export interface ScoreResult {
  score: number;
  normalizedScore: number; // 0–1000, difficulty already factored in
  difficulty: Difficulty;
}

export interface GameFormula {
  /**
   * Documents inputs and formula so it can be tuned independently.
   * Format: "inputs → formula → output range"
   */
  description: string;
  /** Max possible raw score (hard difficulty, instant solve, 0 undos, 1st attempt) */
  maxHardScore: number;
  /** Valid time range in seconds for plausibility check [min, max] */
  timeBounds: [number, number];
  /** Per-difficulty multiplier applied to the base score */
  difficultyMultipliers: Record<Difficulty, number>;
  compute: (data: PuzzleRawData, difficulty: Difficulty) => number;
}

export interface LeaderboardEntry {
  rank: number;
  uid: string;
  displayName: string;
  score: number;
  normalizedScore: number;
  difficulty: Difficulty;
  updatedAt: string;
}

export interface UserGameBest {
  score: number;
  normalizedScore: number;
  difficulty: Difficulty;
  puzzleId: number;
  updatedAt: string;
}

export interface UserScoresResponse {
  globalScore: number;
  gamesBest: Partial<Record<GameId, UserGameBest>>;
  difficultyCompletions: Partial<Record<GameId, Partial<Record<Difficulty, number>>>>;
}
