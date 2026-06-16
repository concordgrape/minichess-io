export interface MatePuzzle {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  /** Standard FEN. Side to move is the solver (always White in these sets). */
  fen: string;
  description: string;
}

export type GameStatus = "playing" | "solved" | "stalemate" | "exceeded";
