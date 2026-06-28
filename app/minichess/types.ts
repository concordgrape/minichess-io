export type PieceCode =
  | "K" | "Q" | "R" | "N" | "B" | "P"   // white (uppercase)
  | "k" | "q" | "r" | "n" | "b" | "p";  // black (lowercase)

export interface Square { row: number; col: number; }

export type Board = (PieceCode | null)[][];

export interface Move {
  from: Square;
  to: Square;
  piece: PieceCode;
  capture?: PieceCode;
  promotion?: boolean;
}

export interface DailyPosition {
  id: number;
  board: Board;
}

export type Turn = "white" | "black";

export type GameStatus =
  | "playing"
  | "won"               // white wins
  | "lost"              // black wins
  | "draw-stalemate"
  | "draw-insufficient"
  | "timeout";

export interface MoveRecord {
  move: Move;
  boardAfter: Board;
  notation: string;
  turn: Turn;
}

export interface SavedGame {
  positionId: number;
  board: Board;
  history: MoveRecord[];
  turn: Turn;
  status: GameStatus;
}
