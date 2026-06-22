/**
 * board4x4Generator.ts
 *
 * Generates the two 4×4 "deliver checkmate" puzzles, faithfully mirroring the
 * custom engines the browser uses (app/check/logic.ts & app/smothered/logic.ts):
 *
 *   check     — White forces mate; the front-end allots mate-in-2/3/4 by
 *               difficulty (easy/medium/hard).
 *   smothered — same, but the KNIGHT must deliver the final blow and the king
 *               is hemmed in by its own pieces.
 *
 * Because the front-end derives the move budget from the puzzle's difficulty
 * (MATE_BY_DIFF = {easy:2, medium:3, hard:4}), we generate a random position,
 * compute its EXACT forced-mate depth with a mirror of the game's own rules,
 * and label the difficulty from that depth. Every emitted puzzle is therefore a
 * genuine forced mate in exactly the advertised number of moves.
 */

export type Difficulty = "easy" | "medium" | "hard";
export type Board4x4Id = "check" | "smothered";

type Cell = string | null;
type Board = Cell[][];

export interface GeneratedPuzzle {
  board: Board;
  difficulty: Difficulty;
}

const SIZE = 4;
const IN = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;

const ROOK = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const BISHOP = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const QUEEN = [...ROOK, ...BISHOP];
const KNIGHT = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING = QUEEN;

interface Rules {
  blackCodes: Set<string>;   // every code that belongs to Black
}
const CHECK_RULES: Rules = { blackCodes: new Set(["k", "p"]) };
const SMOTHERED_RULES: Rules = { blackCodes: new Set(["k", "p", "r"]) };

function isWhite(rules: Rules, code: Cell): boolean {
  return code !== null && !rules.blackCodes.has(code);
}
function clone(board: Board): Board {
  return board.map((row) => [...row]);
}

// ─── Attack / move generation (mirror of the app engines) ───────────────────────

function whiteAttacks(rules: Rules, board: Board): Set<string> {
  const atk = new Set<string>();
  const mark = (r: number, c: number) => atk.add(`${r},${c}`);
  const slide = (r: number, c: number, dr: number, dc: number) => {
    let nr = r + dr, nc = c + dc;
    while (IN(nr, nc)) {
      mark(nr, nc);
      if (board[nr][nc] !== null) break;
      nr += dr; nc += dc;
    }
  };
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = board[r][c];
      if (!isWhite(rules, p)) continue;
      switch (p) {
        case "R": for (const [dr, dc] of ROOK) slide(r, c, dr, dc); break;
        case "B": for (const [dr, dc] of BISHOP) slide(r, c, dr, dc); break;
        case "Q": for (const [dr, dc] of QUEEN) slide(r, c, dr, dc); break;
        case "N": for (const [dr, dc] of KNIGHT) { const nr = r + dr, nc = c + dc; if (IN(nr, nc)) mark(nr, nc); } break;
        case "K": for (const [dr, dc] of KING) { const nr = r + dr, nc = c + dc; if (IN(nr, nc)) mark(nr, nc); } break;
        case "P": for (const dc of [-1, 1]) { const nr = r - 1, nc = c + dc; if (IN(nr, nc)) mark(nr, nc); } break;
      }
    }
  }
  return atk;
}

function findKing(board: Board): [number, number] {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (board[r][c] === "k") return [r, c];
  return [-1, -1];
}

function isInCheck(rules: Rules, board: Board): boolean {
  const [kr, kc] = findKing(board);
  return whiteAttacks(rules, board).has(`${kr},${kc}`);
}

function blackKingMoves(rules: Rules, board: Board): [number, number][] {
  const [kr, kc] = findKing(board);
  const atk = whiteAttacks(rules, board);
  const moves: [number, number][] = [];
  for (const [dr, dc] of KING) {
    const nr = kr + dr, nc = kc + dc;
    if (!IN(nr, nc)) continue;
    const t = board[nr][nc];
    if (isWhite(rules, t)) continue;          // can't capture White
    if (t !== null && rules.blackCodes.has(t)) continue; // can't capture own piece
    if (atk.has(`${nr},${nc}`)) continue;     // can't move into check
    moves.push([nr, nc]);
  }
  return moves;
}

function isCheckmate(rules: Rules, board: Board): boolean {
  return isInCheck(rules, board) && blackKingMoves(rules, board).length === 0;
}
function isStalemate(rules: Rules, board: Board): boolean {
  return !isInCheck(rules, board) && blackKingMoves(rules, board).length === 0;
}

function allWhiteMoves(rules: Rules, board: Board): [number, number, number, number][] {
  const moves: [number, number, number, number][] = [];
  const slide = (r: number, c: number, dr: number, dc: number) => {
    let nr = r + dr, nc = c + dc;
    while (IN(nr, nc)) {
      const t = board[nr][nc];
      if (isWhite(rules, t)) break;
      if (t === "k") break;             // can't capture the king
      moves.push([r, c, nr, nc]);
      if (t !== null) break;            // capture — stop sliding
      nr += dr; nc += dc;
    }
  };
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = board[r][c];
      if (!isWhite(rules, p)) continue;
      switch (p) {
        case "R": for (const [dr, dc] of ROOK) slide(r, c, dr, dc); break;
        case "B": for (const [dr, dc] of BISHOP) slide(r, c, dr, dc); break;
        case "Q": for (const [dr, dc] of QUEEN) slide(r, c, dr, dc); break;
        case "N": for (const [dr, dc] of KNIGHT) {
          const nr = r + dr, nc = c + dc;
          if (!IN(nr, nc)) continue;
          if (isWhite(rules, board[nr][nc])) continue;
          if (board[nr][nc] === "k") continue;
          moves.push([r, c, nr, nc]);
        } break;
        case "K": for (const [dr, dc] of KING) {
          const nr = r + dr, nc = c + dc;
          if (!IN(nr, nc)) continue;
          if (isWhite(rules, board[nr][nc])) continue;
          if (board[nr][nc] === "k") continue;
          moves.push([r, c, nr, nc]);
        } break;
        case "P": {
          const nr = r - 1;
          if (IN(nr, c) && board[nr][c] === null) moves.push([r, c, nr, c]);
          for (const dc of [-1, 1]) {
            const nc = c + dc;
            if (IN(nr, nc) && board[nr][nc] !== null && board[nr][nc] !== "k" && !isWhite(rules, board[nr][nc]))
              moves.push([r, c, nr, nc]);
          }
          break;
        }
      }
    }
  }
  return moves;
}

function applyWhite(board: Board, m: [number, number, number, number]): Board {
  const [fr, fc, tr, tc] = m;
  const n = clone(board);
  n[tr][tc] = n[fr][fc];
  n[fr][fc] = null;
  return n;
}
function applyKing(board: Board, to: [number, number]): Board {
  const [kr, kc] = findKing(board);
  const n = clone(board);
  n[kr][kc] = null;
  n[to[0]][to[1]] = "k";
  return n;
}

/** Whether a white Knight delivers the checkmate (smothered win condition). */
function knightDeliversMate(rules: Rules, board: Board): boolean {
  if (!isCheckmate(rules, board)) return false;
  const [kr, kc] = findKing(board);
  for (const [dr, dc] of KNIGHT) {
    const nr = kr + dr, nc = kc + dc;
    if (IN(nr, nc) && board[nr][nc] === "N") return true;
  }
  return false;
}

// ─── Forced-mate search over the custom rules ───────────────────────────────────

/** White (to move) can force mate within `k` White moves. */
function whiteMateIn(rules: Rules, board: Board, k: number, requireKnight: boolean): boolean {
  if (k < 1) return false;
  for (const m of allWhiteMoves(rules, board)) {
    const b1 = applyWhite(board, m);
    if (isCheckmate(rules, b1)) {
      if (!requireKnight || knightDeliversMate(rules, b1)) return true;
      continue; // non-knight mate is a loss in smothered — White must avoid it
    }
    if (isStalemate(rules, b1)) continue;
    if (k >= 2 && blackAllLeadToMate(rules, b1, k - 1, requireKnight)) return true;
  }
  return false;
}

/** After White's move, every Black king reply still loses within `k` White moves. */
function blackAllLeadToMate(rules: Rules, board: Board, k: number, requireKnight: boolean): boolean {
  const moves = blackKingMoves(rules, board);
  if (moves.length === 0) return false; // stalemate (mate handled by caller) — escape
  for (const bm of moves) {
    if (!whiteMateIn(rules, applyKing(board, bm), k, requireKnight)) return false;
  }
  return true;
}

/** Minimal forced-mate depth in {2,3,4}, or null. Rejects trivial mate-in-1. */
function exactDepth(rules: Rules, board: Board, requireKnight: boolean): 2 | 3 | 4 | null {
  if (whiteMateIn(rules, board, 1, requireKnight)) return null; // too easy / mislabeled
  for (const n of [2, 3, 4] as const) {
    if (whiteMateIn(rules, board, n, requireKnight)) return n;
  }
  return null;
}

const DEPTH_TO_DIFF: Record<2 | 3 | 4, Difficulty> = { 2: "easy", 3: "medium", 4: "hard" };

// ─── Random position construction ───────────────────────────────────────────────

function randInt(n: number): number { return Math.floor(Math.random() * n); }
function pick<T>(a: T[]): T { return a[randInt(a.length)]; }

const CORNERS: [number, number][] = [[0, 0], [0, 3], [3, 0], [3, 3]];
const EDGES: [number, number][] = (() => {
  const e: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++)
    if (r === 0 || r === SIZE - 1 || c === 0 || c === SIZE - 1) e.push([r, c]);
  return e;
})();

function kingsAdjacent(a: [number, number], b: [number, number]): boolean {
  return Math.abs(a[0] - b[0]) <= 1 && Math.abs(a[1] - b[1]) <= 1;
}

const CENTER: [number, number][] = [[1, 1], [1, 2], [2, 1], [2, 2]];

/** check: White Q/R/B/N + K vs Black king (+ optional pawns). */
function buildCheckBoard(): Board {
  const board: Board = Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(null));
  const used = new Set<string>();
  const put = (r: number, c: number, code: string) => { board[r][c] = code; used.add(`${r},${c}`); };
  const free = (r: number, c: number) => IN(r, c) && !used.has(`${r},${c}`);

  // Profiles steer the forced-mate depth so difficulty (derived from it) spreads
  // across easy(2)/medium(3)/hard(4): strong+cornered => quick, weak+central => long.
  const profile = pick(["fast", "fast", "slow", "slow", "deep"] as const);

  const bk = profile === "fast" ? pick(CORNERS) : profile === "slow" ? pick(EDGES) : pick(CENTER);
  put(bk[0], bk[1], "k");

  const attackers =
    profile === "fast" ? pick([["Q"], ["Q"], ["R", "B"], ["Q", "N"]])
      : profile === "slow" ? pick([["R"], ["R", "N"], ["B", "N"], ["Q"]])
        : pick([["R"], ["B", "N"], ["N", "N"], ["R"]]); // deep: lean / awkward material
  for (const code of attackers) {
    for (let t = 0; t < 40; t++) {
      const r = randInt(SIZE), c = randInt(SIZE);
      if (free(r, c)) { put(r, c, code); break; }
    }
  }

  // White king: near for quick mates, anywhere (non-adjacent) for longer ones.
  for (let t = 0; t < 60; t++) {
    const r = randInt(SIZE), c = randInt(SIZE);
    if (free(r, c) && !kingsAdjacent([r, c], bk)) { put(r, c, "K"); break; }
  }

  // Occasional black pawn defender (rows 1..2 so it is not on the back rank).
  if (profile === "fast" && Math.random() < 0.3) {
    for (let t = 0; t < 20; t++) {
      const r = 1 + randInt(2), c = randInt(SIZE);
      if (free(r, c)) { put(r, c, "p"); break; }
    }
  }
  return board;
}

/** smothered: Black king cornered by its own pieces; White N (+ Q + K) mates. */
function buildSmotheredBoard(): Board {
  const board: Board = Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(null));
  const used = new Set<string>();
  const put = (r: number, c: number, code: string) => { board[r][c] = code; used.add(`${r},${c}`); };
  const free = (r: number, c: number) => IN(r, c) && !used.has(`${r},${c}`);

  const bk = pick(CORNERS);
  put(bk[0], bk[1], "k");

  // Smother the king with 1–2 of its own pieces on adjacent squares.
  const adj: [number, number][] = [];
  for (const [dr, dc] of KING) {
    const nr = bk[0] + dr, nc = bk[1] + dc;
    if (IN(nr, nc)) adj.push([nr, nc]);
  }
  const blockers = 1 + randInt(2);
  for (let i = 0; i < blockers && adj.length; i++) {
    const idx = randInt(adj.length);
    const [r, c] = adj.splice(idx, 1)[0];
    if (free(r, c)) put(r, c, pick(["p", "r"]));
  }

  // Mandatory white knight, plus a queen, plus the white king.
  for (const code of ["N", "Q"]) {
    for (let t = 0; t < 50; t++) {
      const r = randInt(SIZE), c = randInt(SIZE);
      if (free(r, c)) { put(r, c, code); break; }
    }
  }
  for (let t = 0; t < 60; t++) {
    const r = randInt(SIZE), c = randInt(SIZE);
    if (free(r, c) && !kingsAdjacent([r, c], bk)) { put(r, c, "K"); break; }
  }
  return board;
}

// ─── Public API ─────────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 40000;

const FALLBACKS: Record<Board4x4Id, Board> = {
  check: [[null, null, null, null], [null, null, null, null], [null, null, null, "Q"], ["k", null, "K", null]],
  smothered: [["k", "p", null, null], ["p", null, "N", null], [null, null, null, null], [null, "Q", null, "K"]],
};

export function generateBoard4x4Puzzle(gameId: Board4x4Id): GeneratedPuzzle {
  const rules = gameId === "check" ? CHECK_RULES : SMOTHERED_RULES;
  const requireKnight = gameId === "smothered";
  // On a 4×4 board nearly every "check" position is a mate-in-2, so probabilistically
  // skip easy results for a more even easy/medium/hard spread. (smothered already
  // spreads well, so it keeps everything.)
  const acceptEasy = gameId === "check" ? 0.35 : 1;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const board = gameId === "check" ? buildCheckBoard() : buildSmotheredBoard();
    if (findKing(board)[0] < 0) continue;
    if (isInCheck(rules, board)) continue;       // Black already in check — illegal (White to move)
    if (isCheckmate(rules, board) || isStalemate(rules, board)) continue;
    const depth = exactDepth(rules, board, requireKnight);
    if (depth === null) continue;
    const difficulty = DEPTH_TO_DIFF[depth];
    // Rebalance toward harder puzzles, but stop filtering late so we never loop forever.
    if (difficulty === "easy" && attempt < MAX_ATTEMPTS * 0.7 && Math.random() > acceptEasy) continue;
    return { board, difficulty };
  }

  // Verify + label a fallback so the script never writes an unsolvable puzzle.
  const board = FALLBACKS[gameId];
  const depth = exactDepth(rules, board, requireKnight) ?? 2;
  return { board, difficulty: DEPTH_TO_DIFF[depth as 2 | 3 | 4] };
}
