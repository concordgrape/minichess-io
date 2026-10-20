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
  return code !== null && code !== "k" && code !== "p";
}

function isBlack(code: PieceCode | null): boolean {
  return code === "k" || code === "p";
}

/** All squares attacked by white pieces on this board. */
export function whiteAttacks(board: Board): Set<string> {
  const attacked = new Set<string>();

  const mark = (r: number, c: number) => attacked.add(`${r},${c}`);

  const slide = (r: number, c: number, dr: number, dc: number) => {
    let nr = r + dr, nc = c + dc;
    while (IN_BOUNDS(nr, nc)) {
      mark(nr, nc);
      if (board[nr][nc] !== null) break; // blocked
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
        case "K":
          for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) {
            const nr = r + dr, nc = c + dc;
            if (IN_BOUNDS(nr, nc)) mark(nr, nc);
          }
          break;
        case "P":
          // White pawn attacks diagonally forward (up = decreasing row)
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
  // Fallback: return off-board sentinel (shouldn't happen in valid puzzles)
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
    if (isWhite(target)) continue; // can't move to white-occupied square
    if (target === "p") continue;  // can't capture own black pawns
    if (attacked.has(`${nr},${nc}`)) continue; // can't move into check
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

/** Apply black King move. */
export function applyKingMove(board: Board, to: Square): Board {
  const king = findKing(board);
  const next = cloneBoard(board);
  next[king.row][king.col] = null;
  next[to.row][to.col] = "k";
  return next;
}

/** Apply a white piece move from (fr,fc) to (tr,tc). */
export function applyWhiteMove(board: Board, from: Square, to: Square): Board {
  const next = cloneBoard(board);
  next[to.row][to.col] = next[from.row][from.col];
  next[from.row][from.col] = null;
  return next;
}

/** All legal white moves: returns [from, to] pairs. */
export function allWhiteMoves(board: Board): { from: Square; to: Square }[] {
  const moves: { from: Square; to: Square }[] = [];

  const addSlide = (r: number, c: number, dr: number, dc: number) => {
    let nr = r + dr, nc = c + dc;
    while (IN_BOUNDS(nr, nc)) {
      const target = board[nr][nc];
      if (isWhite(target)) break; // blocked by own piece
      if (target === "k") break;  // can't capture the king
      moves.push({ from: { row: r, col: c }, to: { row: nr, col: nc } });
      if (target !== null) break; // capture — stop
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
            if (board[nr][nc] === "k") continue; // can't capture king
            moves.push({ from: { row: r, col: c }, to: { row: nr, col: nc } });
          }
          break;
        case "K":
          for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) {
            const nr = r + dr, nc = c + dc;
            if (!IN_BOUNDS(nr, nc)) continue;
            if (isWhite(board[nr][nc])) continue;
            if (board[nr][nc] === "k") continue; // can't capture king
            moves.push({ from: { row: r, col: c }, to: { row: nr, col: nc } });
          }
          break;
        case "P": {
          // Move forward (up = decreasing row)
          const nr = r - 1;
          if (IN_BOUNDS(nr, c) && board[nr][c] === null) {
            moves.push({ from: { row: r, col: c }, to: { row: nr, col: c } });
          }
          // Diagonal captures
          for (const dc2 of [-1, 1]) {
            const nc2 = c + dc2;
            if (IN_BOUNDS(nr, nc2) && isBlack(board[nr][nc2]) && board[nr][nc2] !== "k") {
              moves.push({ from: { row: r, col: c }, to: { row: nr, col: nc2 } });
            }
          }
          break;
        }
      }
    }
  }
  return moves;
}

/**
 * Minimax for black King: returns the depth at which black gets mated (lower = sooner).
 * Black wants to maximize, white wants to minimize.
 * depth counts half-moves remaining.
 */
export function blackBestMove(board: Board): Square | null {
  const moves = blackKingMoves(board);
  if (moves.length === 0) return null;

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const next = applyKingMove(board, move);
    // Score: higher = better for black (delays mate longer)
    const score = blackEval(next, 4);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

/** Evaluate position from black's perspective: higher = better for black. */
function blackEval(board: Board, depth: number): number {
  if (isCheckmate(board)) return -1000 + (10 - depth); // mated — bad for black, sooner = worse
  if (isStalemate(board)) return 500; // stalemate = good for black
  if (depth === 0) return 0;

  // White moves
  const whiteMoves = allWhiteMoves(board);
  let worstForBlack = Infinity;
  for (const { from, to } of whiteMoves) {
    const next = applyWhiteMove(board, from, to);
    // Black responds
    const blackMoves = blackKingMoves(next);
    if (blackMoves.length === 0) {
      const val = isCheckmate(next) ? -1000 + (10 - depth) : 500;
      worstForBlack = Math.min(worstForBlack, val);
    } else {
      let bestForBlack = -Infinity;
      for (const bm of blackMoves) {
        const nn = applyKingMove(next, bm);
        const v = blackEval(nn, depth - 1);
        bestForBlack = Math.max(bestForBlack, v);
      }
      worstForBlack = Math.min(worstForBlack, bestForBlack);
    }
  }
  return worstForBlack === Infinity ? 0 : worstForBlack;
}

/** Get all squares a white piece at (r,c) can legally move to. */
export function getWhitePieceMoves(board: Board, r: number, c: number): Square[] {
  return allWhiteMoves(board)
    .filter((m) => m.from.row === r && m.from.col === c)
    .map((m) => m.to);
}
