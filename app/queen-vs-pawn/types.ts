export interface PawnPuzzle {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  /** Standard FEN. White (queen side) to move; must capture the pawn before it promotes. */
  fen: string;
  /** Forced win in this many White moves. */
  winIn: number;
  description: string;
}

export type GameStatus = "playing" | "won" | "promoted" | "exceeded" | "draw";
