import type { Board, PieceType, Square } from "./types";

const SIZE = 4;
const IN = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

function occupied(board: Board, r: number, c: number): PieceType | null {
  return IN(r, c) ? board[r][c] : null;
}

/** Returns all squares with pieces that the piece at (r,c) can legally capture. */
export function getLegalCaptures(board: Board, r: number, c: number): Square[] {
  const piece = board[r][c];
  if (!piece) return [];
  const targets: Square[] = [];

  const slide = (dr: number, dc: number) => {
    let nr = r + dr, nc = c + dc;
    while (IN(nr, nc)) {
      if (board[nr][nc] !== null) { targets.push({ row: nr, col: nc }); break; }
      nr += dr; nc += dc;
    }
  };

  switch (piece) {
    case "r":
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) slide(dr, dc);
      break;
    case "b":
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr, dc);
      break;
    case "q":
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr, dc);
      break;
    case "n":
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const nr = r + dr, nc = c + dc;
        if (IN(nr, nc) && board[nr][nc] !== null) targets.push({ row: nr, col: nc });
      }
      break;
    case "p":
      // Pawn captures all four diagonals — no colour distinction in Solitaire
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
        const nr = r + dr, nc = c + dc;
        if (IN(nr, nc) && board[nr][nc] !== null) targets.push({ row: nr, col: nc });
      }
      break;
    case "k":
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) {
        const nr = r + dr, nc = c + dc;
        if (IN(nr, nc) && board[nr][nc] !== null) targets.push({ row: nr, col: nc });
      }
      break;
  }
  return targets;
}

/**
 * Apply a capture: controlled piece moves from `from` to `to`, transforms into
 * the captured piece type, and removes the captured piece.
 */
export function applyCapture(board: Board, from: Square, to: Square): Board {
  const targetType = board[to.row][to.col]!;
  const next = cloneBoard(board);
  next[from.row][from.col] = null;
  next[to.row][to.col] = targetType; // player becomes target type
  return next;
}

/** Count non-null squares on the board. */
export function pieceCount(board: Board): number {
  return board.flat().filter(Boolean).length;
}

/** DFS solver — returns true if there is at least one path to victory. */
export function isSolvable(board: Board, pos: Square): boolean {
  if (pieceCount(board) === 1) return true;
  const captures = getLegalCaptures(board, pos.row, pos.col);
  if (captures.length === 0) return false;
  return captures.some((to) => isSolvable(applyCapture(board, pos, to), to));
}

/** Count all winning paths (for puzzle quality checks). */
export function countSolutions(board: Board, pos: Square): number {
  if (pieceCount(board) === 1) return 1;
  const captures = getLegalCaptures(board, pos.row, pos.col);
  if (captures.length === 0) return 0;
  return captures.reduce((sum, to) => sum + countSolutions(applyCapture(board, pos, to), to), 0);
}
