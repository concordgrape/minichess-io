export type PieceCode =
  | "k" | "p" | "r"              // black pieces (king, pawn, rook)
  | "Q" | "R" | "B" | "N" | "P"; // white pieces

export interface Square {
  row: number;
  col: number;
}

// Board is 4×4, null = empty
export type Board = (PieceCode | null)[][];

export interface Puzzle {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  mateIn: number;
  description: string;
  board: Board;
}

export type GameStatus =
  | "playing"
  | "won"               // Knight delivers checkmate
  | "lost-wrong-piece"  // Another piece delivers checkmate
  | "lost-stalemate"
  | "lost-exceeded";
