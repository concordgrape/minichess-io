export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

export interface Piece {
  id: string;
  type: PieceType;
  row: number;
  col: number;
}

export interface Puzzle {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  pieces: Piece[];
}

export type GameStatus = "playing" | "won" | "lost";
