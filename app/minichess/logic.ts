import type { Board, Move, PieceCode, Square } from "./types";

export const SIZE = 5;
const IN = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;

export function isWhitePiece(p: string | null): p is PieceCode {
  return !!p && p === p.toUpperCase();
}
export function isBlackPiece(p: string | null): p is PieceCode {
  return !!p && p === p.toLowerCase();
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/** Algebraic square name: col→file (a-e), row→rank (5-1) */
export function squareName(row: number, col: number): string {
  return `${String.fromCharCode(97 + col)}${SIZE - row}`;
}

/** Build algebraic-style notation for a move (before it is applied). */
export function moveNotation(boardBefore: Board, move: Move): string {
  const p = boardBefore[move.from.row][move.from.col];
  if (!p) return "?";
  const isPawn = p.toLowerCase() === "p";
  const symbol = isPawn ? "" : p.toUpperCase();
  const sep = move.capture ? "×" : "–";
  const promo = move.promotion ? "=Q" : "";
  return `${symbol}${squareName(move.from.row, move.from.col)}${sep}${squareName(move.to.row, move.to.col)}${promo}`;
}

// ─── Move generation ─────────────────────────────────────────────────────────

/**
 * Pseudo-legal moves for the piece at (r,c) — does not filter for check.
 * Used both for legal-move generation (after check-filter) and for attack
 * detection in isInCheck (where we must NOT filter for check to avoid
 * circular dependency).
 */
function pseudoMoves(board: Board, r: number, c: number): Move[] {
  const piece = board[r][c];
  if (!piece) return [];
  const white = isWhitePiece(piece);
  const moves: Move[] = [];

  const push = (tr: number, tc: number) => {
    if (!IN(tr, tc)) return false;
    const target = board[tr][tc];
    if (target && (white ? isWhitePiece(target) : isBlackPiece(target))) return false; // own piece
    moves.push({
      from: { row: r, col: c },
      to: { row: tr, col: tc },
      piece,
      capture: target ?? undefined,
    });
    return true;
  };

  const slide = (dr: number, dc: number) => {
    let nr = r + dr, nc = c + dc;
    while (IN(nr, nc)) {
      const target = board[nr][nc];
      if (target) {
        if (white ? isBlackPiece(target) : isWhitePiece(target)) {
          moves.push({ from: { row: r, col: c }, to: { row: nr, col: nc }, piece, capture: target });
        }
        break; // blocked
      }
      moves.push({ from: { row: r, col: c }, to: { row: nr, col: nc }, piece });
      nr += dr; nc += dc;
    }
  };

  const lp = piece.toLowerCase();

  switch (lp) {
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
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])
        push(r + dr, c + dc);
      break;
    case "k":
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]])
        push(r + dr, c + dc);
      break;
    case "p": {
      const dir = white ? -1 : 1;
      const nr = r + dir;
      // Forward (non-capture)
      if (IN(nr, c) && !board[nr][c]) {
        const promotion = (white && nr === 0) || (!white && nr === SIZE - 1);
        moves.push({ from: { row: r, col: c }, to: { row: nr, col: c }, piece, promotion });
      }
      // Diagonal captures
      for (const dc of [-1, 1]) {
        const nc = c + dc;
        if (!IN(nr, nc)) continue;
        const target = board[nr][nc];
        if (target && (white ? isBlackPiece(target) : isWhitePiece(target))) {
          const promotion = (white && nr === 0) || (!white && nr === SIZE - 1);
          moves.push({ from: { row: r, col: c }, to: { row: nr, col: nc }, piece, capture: target, promotion });
        }
      }
      break;
    }
  }
  return moves;
}

/** Apply a move to the board (immutable). Handles pawn promotion → Queen. */
export function applyMove(board: Board, move: Move): Board {
  const next = cloneBoard(board);
  next[move.to.row][move.to.col] = next[move.from.row][move.from.col];
  next[move.from.row][move.from.col] = null;
  // Auto-promote
  if (move.promotion) {
    next[move.to.row][move.to.col] = isWhitePiece(move.piece) ? "Q" : "q";
  }
  return next;
}

/** Find the king for the given colour. */
export function findKing(board: Board, white: boolean): Square | null {
  const target = white ? "K" : "k";
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (board[r][c] === target) return { row: r, col: c };
  return null;
}

/** True if the given colour's king is currently in check. */
export function isInCheck(board: Board, white: boolean): boolean {
  const king = findKing(board, white);
  if (!king) return false;
  // Check if any opponent piece has a pseudo-legal move targeting the king's square
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (white ? !isBlackPiece(p) : !isWhitePiece(p)) continue; // skip own pieces
      if (pseudoMoves(board, r, c).some((m) => m.to.row === king.row && m.to.col === king.col))
        return true;
    }
  }
  return false;
}

/** Get fully legal moves for one piece at (r,c). */
export function getMovesForSquare(board: Board, r: number, c: number): Move[] {
  const p = board[r][c];
  if (!p) return [];
  const white = isWhitePiece(p);
  return pseudoMoves(board, r, c).filter((m) => {
    const next = applyMove(board, m);
    return !isInCheck(next, white);
  });
}

/** Get all fully legal moves for a colour. */
export function getLegalMoves(board: Board, white: boolean): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (white ? !isWhitePiece(p) : !isBlackPiece(p)) continue;
      moves.push(...getMovesForSquare(board, r, c));
    }
  return moves;
}

export function isCheckmate(board: Board, white: boolean): boolean {
  return isInCheck(board, white) && getLegalMoves(board, white).length === 0;
}

export function isStalemate(board: Board, white: boolean): boolean {
  return !isInCheck(board, white) && getLegalMoves(board, white).length === 0;
}

export function isInsufficientMaterial(board: Board): boolean {
  const pieces = board.flat().filter(Boolean);
  return pieces.length === 2 && pieces.every((p) => p!.toLowerCase() === "k");
}

// ─── AI ──────────────────────────────────────────────────────────────────────

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, r: 5, q: 9, k: 0, b: 3 };
const CENTRE_SQUARES = new Set(["2,1", "2,2", "2,3"]);
const CHECKMATE_SCORE = 10_000;

/** Static evaluation — positive = good for black (black maximises). */
function evaluate(board: Board): number {
  let score = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = board[r][c];
      if (!p) continue;
      const val = PIECE_VALUES[p.toLowerCase()];
      const black = isBlackPiece(p);
      score += black ? val : -val;
      // Centre bonus
      if (CENTRE_SQUARES.has(`${r},${c}`)) score += black ? 0.1 : -0.1;
      // Knight rim penalty
      if (p.toLowerCase() === "n") {
        const onRim = r === 0 || r === SIZE - 1 || c === 0 || c === SIZE - 1;
        if (onRim) score += black ? -0.2 : 0.2;
      }
    }
  }
  return score;
}

function moveOrderScore(move: Move): number {
  // Captures first (MVV-LVA)
  if (move.capture) return 10 * PIECE_VALUES[move.capture.toLowerCase()] - PIECE_VALUES[move.piece.toLowerCase()];
  return 0;
}

function minimax(board: Board, depth: number, alpha: number, beta: number, blackTurn: boolean): number {
  // Quiescence-lite: at depth 0, return static eval
  if (depth === 0) return evaluate(board);

  const legalMoves = getLegalMoves(board, !blackTurn);
  if (legalMoves.length === 0) {
    const inCheck = isInCheck(board, !blackTurn);
    if (inCheck) {
      // Current side is mated
      return blackTurn ? (-CHECKMATE_SCORE - depth) : (CHECKMATE_SCORE + depth);
    }
    return 0; // stalemate = draw
  }
  if (isInsufficientMaterial(board)) return 0;

  // Sort moves: captures first for better pruning
  legalMoves.sort((a, b) => moveOrderScore(b) - moveOrderScore(a));

  if (blackTurn) {
    let best = -Infinity;
    for (const move of legalMoves) {
      const next = applyMove(board, move);
      const score = minimax(next, depth - 1, alpha, beta, false);
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of legalMoves) {
      const next = applyMove(board, move);
      const score = minimax(next, depth - 1, alpha, beta, true);
      best = Math.min(best, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return best;
  }
}

/**
 * Return the best move for black, or null if no legal moves.
 * `depth` controls minimax search depth; `randomFraction` is the probability
 * of playing a random move instead (simulates lower-ELO blunders).
 */
export function getBestMove(board: Board, depth = 3, randomFraction = 0): Move | null {
  const moves = getLegalMoves(board, false);
  if (moves.length === 0) return null;

  if (randomFraction > 0 && Math.random() < randomFraction) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  moves.sort((a, b) => moveOrderScore(b) - moveOrderScore(a));

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const next = applyMove(board, move);
    const score = minimax(next, depth - 1, -Infinity, Infinity, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}
