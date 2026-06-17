export interface MatePuzzle {
  id: number;
  difficulty: "easy" | "medium" | "hard";
  /** Standard FEN. Side to move is the solver (always White in these sets). */
  fen: string;
}

export type GameStatus = "playing" | "solved" | "stalemate" | "exceeded";
