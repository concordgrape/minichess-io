/**
 * chainCaptureGenerator.ts
 *
 * Generators for the three "capture-everything" games:
 *
 *   takes           — 4×4, any piece captures, the King can't be taken; clear
 *                     the board down to just the King.
 *   solitaire       — 4×4, ONE controlled piece that becomes whatever it
 *                     captures; reduce the board to a single piece.
 *   chess-solitaire — 8×8, any piece captures (keeping its own type); reduce to
 *                     a single piece.
 *
 * Solvability is GUARANTEED by construction: every puzzle is built backwards
 * from the solved state by reversing legal captures, so replaying those moves
 * forward always clears the board. This both guarantees a solution exists and
 * produces highly varied positions (no duplicates).
 */

export type Difficulty = "easy" | "medium" | "hard";

// ─── Capture geometry (mirrors each game's logic.ts) ────────────────────────────

const ROOK = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const BISHOP = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const QUEEN = [...ROOK, ...BISHOP];
const KNIGHT = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING = QUEEN;
const DIAG = BISHOP;

function randInt(n: number): number { return Math.floor(Math.random() * n); }
function pick<T>(a: T[]): T { return a[randInt(a.length)]; }
function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) { const j = randInt(i + 1);[a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const inB = (r: number, c: number, n: number) => r >= 0 && r < n && c >= 0 && c < n;

type RC = [number, number];

function slideFroms(S: RC, dirs: number[][], occ: Set<string>, n: number): RC[] {
  const res: RC[] = [];
  for (const [dr, dc] of dirs) {
    let r = S[0] + dr, c = S[1] + dc;
    while (inB(r, c, n)) {
      if (occ.has(`${r},${c}`)) break;  // first blocker — stop
      res.push([r, c]);                 // empty square: a legal "from", path is clear
      r += dr; c += dc;
    }
  }
  return res;
}
function stepFroms(S: RC, deltas: number[][], occ: Set<string>, n: number): RC[] {
  const res: RC[] = [];
  for (const [dr, dc] of deltas) {
    const r = S[0] + dr, c = S[1] + dc;
    if (inB(r, c, n) && !occ.has(`${r},${c}`)) res.push([r, c]);
  }
  return res;
}

/**
 * All empty squares from which a piece of `type`/`color` could legally capture
 * the piece on square S, given `occ` (squares of every OTHER piece).
 */
function captureFroms(type: string, color: "w" | "b" | null, S: RC, occ: Set<string>, n: number): RC[] {
  const t = type.toLowerCase();
  switch (t) {
    case "q": return slideFroms(S, QUEEN, occ, n);
    case "r": return slideFroms(S, ROOK, occ, n);
    case "b": return slideFroms(S, BISHOP, occ, n);
    case "n": return stepFroms(S, KNIGHT, occ, n);
    case "k": return stepFroms(S, KING, occ, n);
    case "p":
      if (color === null) return stepFroms(S, DIAG, occ, n); // 4×4 games: pawn captures all diagonals
      // 8×8 chess-solitaire: white pawns capture upward (row−1), black downward (row+1)
      return color === "w"
        ? stepFroms(S, [[1, -1], [1, 1]], occ, n)
        : stepFroms(S, [[-1, -1], [-1, 1]], occ, n);
    default: return [];
  }
}

// ─── takes (4×4, multi-piece, king never captured) ──────────────────────────────

export interface TakesPiece { id: string; type: string; row: number; col: number }
export interface TakesData { pieces: TakesPiece[] }

const TAKES_TARGET_TYPES = ["p", "p", "n", "n", "b", "b", "r", "r", "q"];
const TAKES_COUNT: Record<Difficulty, number> = { easy: 4, medium: 6, hard: 8 };

export function generateTakes(difficulty: Difficulty): { difficulty: Difficulty; data: TakesData } {
  const N = 4;
  const target = TAKES_COUNT[difficulty];

  for (let build = 0; build < 200; build++) {
    const pieces: { type: string; r: number; c: number }[] = [];
    const king = { type: "k", r: randInt(N), c: randInt(N) };
    pieces.push(king);

    while (pieces.length < target) {
      let added = false;
      for (const A of shuffle([...pieces])) {
        const occ = new Set(pieces.filter((p) => p !== A).map((p) => `${p.r},${p.c}`));
        const froms = captureFroms(A.type, null, [A.r, A.c], occ, N)
          .filter(([r, c]) => !pieces.some((p) => p.r === r && p.c === c));
        if (froms.length === 0) continue;
        const [fr, fc] = pick(froms);
        const S: RC = [A.r, A.c];
        A.r = fr; A.c = fc;                       // attacker steps back
        pieces.push({ type: pick(TAKES_TARGET_TYPES), r: S[0], c: S[1] }); // captured piece reappears
        added = true;
        break;
      }
      if (!added) break;
    }

    if (pieces.length >= Math.min(target, 4)) {
      return {
        difficulty,
        data: { pieces: pieces.map((p, i) => ({ id: `${p.type}${i}`, type: p.type, row: p.r, col: p.c })) },
      };
    }
  }
  // Fallback (known solvable): rook chain into the king.
  return {
    difficulty,
    data: { pieces: [
      { id: "k0", type: "k", row: 3, col: 1 },
      { id: "p1", type: "p", row: 3, col: 0 },
      { id: "r2", type: "r", row: 0, col: 0 },
      { id: "b3", type: "b", row: 0, col: 3 },
    ] },
  };
}

// ─── solitaire (4×4, single controlled piece that transforms) ───────────────────

type Cell = string | null;
export interface SolitaireData { board: Cell[][]; start: { row: number; col: number } }

const SOL_TYPES = ["p", "n", "b", "r", "q"];
const SOL_COUNT: Record<Difficulty, number> = { easy: 3, medium: 5, hard: 6 };

export function generateSolitaire(difficulty: Difficulty): { difficulty: Difficulty; data: SolitaireData } {
  const N = 4;
  const target = SOL_COUNT[difficulty];

  for (let build = 0; build < 300; build++) {
    let cur: RC = [randInt(N), randInt(N)];
    let curType = pick(SOL_TYPES);
    const targets: { r: number; c: number; type: string }[] = [];

    while (targets.length + 1 < target) {
      let added = false;
      for (const prevType of shuffle([...SOL_TYPES])) {
        const occ = new Set(targets.map((t) => `${t.r},${t.c}`));
        const froms = captureFroms(prevType, null, cur, occ, N)
          .filter(([r, c]) => !(r === cur[0] && c === cur[1]) && !targets.some((t) => t.r === r && t.c === c));
        if (froms.length === 0) continue;
        const [fr, fc] = pick(froms);
        targets.push({ r: cur[0], c: cur[1], type: curType }); // the piece that was captured to become curType
        cur = [fr, fc];
        curType = prevType;
        added = true;
        break;
      }
      if (!added) break;
    }

    if (targets.length + 1 >= Math.min(target, 3)) {
      const board: Cell[][] = Array.from({ length: N }, () => Array<Cell>(N).fill(null));
      board[cur[0]][cur[1]] = curType;
      for (const t of targets) board[t.r][t.c] = t.type;
      return { difficulty, data: { board, start: { row: cur[0], col: cur[1] } } };
    }
  }
  // Fallback (known solvable).
  return {
    difficulty,
    data: {
      board: [["r", null, null, "p"], [null, null, "n", null], [null, null, null, null], [null, null, null, "b"]],
      start: { row: 0, col: 0 },
    },
  };
}

// ─── chess-solitaire (8×8, multi-piece with colors) ─────────────────────────────

export interface ChessSolPiece { type: string; color: "w" | "b"; row: number; col: number }
export interface ChessSolData { pieces: ChessSolPiece[] }

const CSOL_TYPES = ["P", "N", "B", "R", "Q", "N", "B", "R"]; // weighted toward non-queens, no kings
const CSOL_COUNT: Record<Difficulty, number> = { easy: 5, medium: 7, hard: 9 };

function randColor(): "w" | "b" { return Math.random() < 0.5 ? "w" : "b"; }

export function generateChessSolitaire(difficulty: Difficulty): { difficulty: Difficulty; data: ChessSolData } {
  const N = 8;
  const target = CSOL_COUNT[difficulty];

  for (let build = 0; build < 200; build++) {
    const pieces: ChessSolPiece[] = [
      { type: pick(CSOL_TYPES), color: randColor(), row: randInt(N), col: randInt(N) },
    ];

    while (pieces.length < target) {
      let added = false;
      for (const A of shuffle([...pieces])) {
        const occ = new Set(pieces.filter((p) => p !== A).map((p) => `${p.row},${p.col}`));
        const froms = captureFroms(A.type, A.color, [A.row, A.col], occ, N)
          .filter(([r, c]) => !pieces.some((p) => p.row === r && p.col === c));
        if (froms.length === 0) continue;
        const [fr, fc] = pick(froms);
        const sr = A.row, sc = A.col;
        A.row = fr; A.col = fc;
        pieces.push({ type: pick(CSOL_TYPES), color: randColor(), row: sr, col: sc });
        added = true;
        break;
      }
      if (!added) break;
    }

    if (pieces.length >= Math.min(target, 4)) {
      return { difficulty, data: { pieces } };
    }
  }
  // Fallback (known solvable).
  return {
    difficulty,
    data: { pieces: [
      { type: "Q", color: "w", row: 0, col: 0 },
      { type: "B", color: "b", row: 2, col: 2 },
      { type: "N", color: "b", row: 6, col: 1 },
      { type: "R", color: "w", row: 4, col: 0 },
    ] },
  };
}
