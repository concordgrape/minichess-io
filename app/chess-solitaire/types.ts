export type PieceColor = "w" | "b";
export type PieceType = "P" | "N" | "B" | "R" | "Q" | "K";
export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface SolitairePiece {
  id: string;
  type: PieceType;
  color: PieceColor;
  row: number;
  col: number;
}

export interface PuzzleDef {
  id: string;
  title: string;
  difficulty: Difficulty;
  description?: string;
  dailyDate?: string;
  pieces: { type: PieceType; color: PieceColor; row: number; col: number }[];
}

export type GameStatus = "playing" | "solved" | "stuck";

export interface MoveRecord {
  attacker: SolitairePiece;
  target: SolitairePiece;
  piecesBefore: SolitairePiece[];
}
