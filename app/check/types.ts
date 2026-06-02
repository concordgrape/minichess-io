export type PieceCode =
  | "k" | "p"                     // black pieces
  | "R" | "B" | "N" | "Q" | "K" | "P"; // white pieces

export interface Square {
  row: number;
  col: number;
}

export interface Piece extends Square {
  code: PieceCode;
}

// Board is 4×4, null = empty, string = piece code
export type Board = (PieceCode | null)[][];

export interface Puzzle {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  mateIn: number;
  description: string;
  board: Board;
}

export type GameStatus = "playing" | "checkmate" | "stalemate" | "exceeded";
