import type { Board, PieceCode, Square } from "./types";

const SIZE = 4;
const IN_BOUNDS = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

export function getAt(board: Board, r: number, c: number): PieceCode | null {
  return IN_BOUNDS(r, c) ? board[r][c] : null;
}

function isWhite(code: PieceCode | null): boolean {
  return code !== null && code !== "k" && code !== "p" && code !== "r";
}

function isBlack(code: PieceCode | null): boolean {
  return code === "k" || code === "p" || code === "r";
}

/** All squares attacked by white pieces. */
export function whiteAttacks(board: Board): Set<string> {
  const attacked = new Set<string>();
  const mark = (r: number, c: number) => attacked.add(`${r},${c}`);

  const slide = (r: number, c: number, dr: number, dc: number) => {
    let nr = r + dr, nc = c + dc;
    while (IN_BOUNDS(nr, nc)) {
      mark(nr, nc);
      if (board[nr][nc] !== null) break;
      nr += dr; nc += dc;
    }
  };

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const piece = board[r][c];
      if (!isWhite(piece)) continue;
      switch (piece) {
        case "R":
          for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) slide(r, c, dr, dc);
          break;
        case "B":
          for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) slide(r, c, dr, dc);
          break;
        case "Q":
          for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) slide(r, c, dr, dc);
          break;
        case "N":
          for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
            const nr = r + dr, nc = c + dc;
            if (IN_BOUNDS(nr, nc)) mark(nr, nc);
          }
          break;
        case "P":
          // White pawn attacks diagonally upward (decreasing row)
          for (const dc of [-1, 1]) {
            const nr = r - 1, nc = c + dc;
            if (IN_BOUNDS(nr, nc)) mark(nr, nc);
          }
          break;
      }
    }
  }
  return attacked;
}

export function findKing(board: Board): Square {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (board[r][c] === "k") return { row: r, col: c };
  return { row: -1, col: -1 };
}

export function isInCheck(board: Board): boolean {
  const king = findKing(board);
  return whiteAttacks(board).has(`${king.row},${king.col}`);
}

/** Legal moves for the black King. */
export function blackKingMoves(board: Board): Square[] {
  const king = findKing(board);
  const attacked = whiteAttacks(board);
  const moves: Square[] = [];
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) {
    const nr = king.row + dr, nc = king.col + dc;
    if (!IN_BOUNDS(nr, nc)) continue;
    const target = board[nr][nc];
    if (isWhite(target)) continue;       // can't move to white-occupied square
    if (target === "p" || target === "r") continue; // can't capture own pieces
    if (attacked.has(`${nr},${nc}`)) continue;
    moves.push({ row: nr, col: nc });
  }
  return moves;
}

export function isCheckmate(board: Board): boolean {
  return isInCheck(board) && blackKingMoves(board).length === 0;
}

export function isStalemate(board: Board): boolean {
  return !isInCheck(board) && blackKingMoves(board).length === 0;
}

/**
 * Returns true if the Knight is the piece giving check in a checkmate position.
 * Used to distinguish "won" vs "lost-wrong-piece".
 */
export function knightDeliversMate(board: Board): boolean {
  if (!isCheckmate(board)) return false;
  const king = findKing(board);
  // Check if any white Knight attacks the king's square
  const knightDeltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr, dc] of knightDeltas) {
    const nr = king.row + dr, nc = king.col + dc;
    if (IN_BOUNDS(nr, nc) && board[nr][nc] === "N") return true;
  }
  return false;
}

/**
 * Returns true if the Knight can deliver checkmate on the very next white move
 * (used for the pulse hint).
 */
export function knightCanMateNextMove(board: Board): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== "N") continue;
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const nr = r + dr, nc = c + dc;
        if (!IN_BOUNDS(nr, nc)) continue;
        const target = board[nr][nc];
        if (isWhite(target)) continue;
        if (target === "k") continue; // can't capture king
        const next = applyWhiteMove(board, { row: r, col: c }, { row: nr, col: nc });
        if (knightDeliversMate(next)) return true;
      }
    }
  }
  return false;
}

export function applyKingMove(board: Board, to: Square): Board {
  const king = findKing(board);
  const next = cloneBoard(board);
  next[king.row][king.col] = null;
  next[to.row][to.col] = "k";
  return next;
}

export function applyWhiteMove(board: Board, from: Square, to: Square): Board {
  const next = cloneBoard(board);
  next[to.row][to.col] = next[from.row][from.col];
  next[from.row][from.col] = null;
  return next;
}

export function allWhiteMoves(board: Board): { from: Square; to: Square }[] {
  const moves: { from: Square; to: Square }[] = [];

  const addSlide = (r: number, c: number, dr: number, dc: number) => {
    let nr = r + dr, nc = c + dc;
    while (IN_BOUNDS(nr, nc)) {
      const target = board[nr][nc];
      if (isWhite(target)) break;
      if (target === "k") break; // can't capture king
      moves.push({ from: { row: r, col: c }, to: { row: nr, col: nc } });
      if (target !== null) break; // capture — stop sliding
      nr += dr; nc += dc;
    }
  };

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const piece = board[r][c];
      if (!isWhite(piece)) continue;
      switch (piece) {
        case "R":
          for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) addSlide(r, c, dr, dc);
          break;
        case "B":
          for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) addSlide(r, c, dr, dc);
          break;
        case "Q":
          for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) addSlide(r, c, dr, dc);
          break;
        case "N":
          for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
            const nr = r + dr, nc = c + dc;
            if (!IN_BOUNDS(nr, nc)) continue;
            if (isWhite(board[nr][nc])) continue;
            if (board[nr][nc] === "k") continue;
            moves.push({ from: { row: r, col: c }, to: { row: nr, col: nc } });
          }
          break;
        case "P": {
          const nr = r - 1;
          if (IN_BOUNDS(nr, c) && board[nr][c] === null)
            moves.push({ from: { row: r, col: c }, to: { row: nr, col: c } });
          for (const dc2 of [-1, 1]) {
            const nc2 = c + dc2;
            if (IN_BOUNDS(nr, nc2) && isBlack(board[nr][nc2]) && board[nr][nc2] !== "k")
              moves.push({ from: { row: r, col: c }, to: { row: nr, col: nc2 } });
          }
          break;
        }
      }
    }
  }
  return moves;
}

export function getWhitePieceMoves(board: Board, r: number, c: number): Square[] {
  return allWhiteMoves(board)
    .filter((m) => m.from.row === r && m.from.col === c)
    .map((m) => m.to);
}

/** Black King AI: pick move that maximises survival. */
export function blackBestMove(board: Board): Square | null {
  const moves = blackKingMoves(board);
  if (moves.length === 0) return null;

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const next = applyKingMove(board, move);
    const score = blackEval(next, 3);
    if (score > bestScore) { bestScore = score; bestMove = move; }
  }
  return bestMove;
}

function blackEval(board: Board, depth: number): number {
  if (isCheckmate(board)) return -1000 + (10 - depth);
  if (isStalemate(board)) return 500;
  if (depth === 0) return 0;

  const whiteMoves = allWhiteMoves(board);
  let worstForBlack = Infinity;
  for (const { from, to } of whiteMoves) {
    const next = applyWhiteMove(board, from, to);
    const blackMoves = blackKingMoves(next);
    if (blackMoves.length === 0) {
      const val = isCheckmate(next) ? -1000 + (10 - depth) : 500;
      worstForBlack = Math.min(worstForBlack, val);
    } else {
      let bestForBlack = -Infinity;
      for (const bm of blackMoves) {
        const nn = applyKingMove(next, bm);
        bestForBlack = Math.max(bestForBlack, blackEval(nn, depth - 1));
      }
      worstForBlack = Math.min(worstForBlack, bestForBlack);
    }
  }
  return worstForBlack === Infinity ? 0 : worstForBlack;
}
