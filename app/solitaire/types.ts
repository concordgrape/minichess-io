export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

export interface Square {
  row: number;
  col: number;
}

// 4×4 board: null = empty, string = piece code
export type Board = (PieceType | null)[][];

export interface Puzzle {
  id: number;
  difficulty: "easy" | "medium" | "hard";
  board: Board;
  start: Square;
}

export type GameStatus = "playing" | "won" | "lost";

export interface HistoryEntry {
  board: Board;
  pos: Square;
}
