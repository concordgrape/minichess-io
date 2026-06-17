export interface PawnPuzzle {
  id: number;
  difficulty: "easy" | "medium" | "hard";
  /** Standard FEN. White (queen side) to move; must capture the pawn before it promotes. */
  fen: string;
}

export type GameStatus = "playing" | "won" | "promoted" | "exceeded" | "draw";
