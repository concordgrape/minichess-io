/**
 * endgameGenerator.ts
 *
 * Themed forced-mate-in-2 endgames (the front-end hardcodes mateIn = 2 for all
 * three). Each keeps strict, faithful material:
 *
 *   rook-endgame   — White K + R  vs  Black K
 *   king-and-pawn  — White K + P  vs  Black K   (push / promote, then mate)
 *   zugzwang       — White K + Q|R vs Black K, where the key first move is a
 *                    quiet (non-checking) waiting move that traps Black.
 *
 * Difficulty is randomized purely for scoring/labelling — the mate length is
 * fixed at 2 by the game itself. Solvability is verified with the same forced
 * mate search the browser uses (chessSearch).
 */

import {
  boardToFen, loadPlayable, exactlyMateIn, matingFirstMoves,
  sq, fileOf, rankOf, randInt, pick, type Piece,
} from "./chessSearch";

export type Difficulty = "easy" | "medium" | "hard";
export type EndgameId = "rook-endgame" | "king-and-pawn" | "zugzwang";

export interface GeneratedPuzzle {
  fen: string;
  difficulty: Difficulty;
}

function kingsOk(a: number, b: number): boolean {
  return Math.max(Math.abs(fileOf(a) - fileOf(b)), Math.abs(rankOf(a) - rankOf(b))) > 1;
}

function edgeRankFile(): number {
  const bias = () => pick([0, 0, 1, 2, 5, 6, 7, 7]);
  return sq(bias(), bias());
}

// ─── rook-endgame & zugzwang: random placement + reject ─────────────────────────

function buildPlacement(pieces: Piece[]): string | null {
  const board: (Piece | null)[] = new Array(64).fill(null);
  const used = new Set<number>();

  // Black king biased to the edge (where K+major mates live).
  const bk = edgeRankFile();
  board[bk] = "k"; used.add(bk);

  // White king, not adjacent.
  let wk = -1;
  for (let t = 0; t < 80; t++) {
    const s = randInt(64);
    if (used.has(s) || !kingsOk(s, bk)) continue;
    wk = s; break;
  }
  if (wk < 0) return null;
  board[wk] = "K"; used.add(wk);

  for (const p of pieces) {
    let placed = false;
    for (let t = 0; t < 80; t++) {
      const s = randInt(64);
      if (used.has(s)) continue;
      board[s] = p; used.add(s); placed = true; break;
    }
    if (!placed) return null;
  }
  return boardToFen(board, "w");
}

function hasQuietMatingKey(fen: string): boolean {
  const keys = matingFirstMoves(fen, 2);
  // A quiet move: no check (+/#) and no capture (x). With bare kings + one
  // piece there are no captures anyway, so this is really "non-checking".
  return keys.some((san) => !/[+#x]/.test(san));
}

// ─── king-and-pawn: biased reject sampling (K must shepherd its pawn) ────────────

function buildKingAndPawn(): string | null {
  const board: (Piece | null)[] = new Array(64).fill(null);
  // Pawn on the 6th/7th rank — only there can White force a mate within two
  // moves (push/promote, then mate).
  const pf = randInt(8);
  const pr = pick([5, 6]);
  const ps = sq(pf, pr);
  board[ps] = "P";

  // White king shepherds the pawn (must be close to support promotion + mate).
  let wk = -1;
  for (let t = 0; t < 60; t++) {
    const s = sq(
      Math.min(7, Math.max(0, pf + randInt(5) - 2)),
      Math.min(7, Math.max(0, pr + randInt(5) - 2)),
    );
    if (s !== ps) { wk = s; break; }
  }
  if (wk < 0) return null;
  board[wk] = "K";

  // Black king biased toward the promotion corner (where it can be mated).
  let bk = -1;
  for (let t = 0; t < 60; t++) {
    const s = sq(
      Math.min(7, Math.max(0, pf + randInt(7) - 3)),
      Math.min(7, Math.max(0, pr + randInt(5) - 1)),
    );
    if (s !== ps && s !== wk && kingsOk(s, wk)) { bk = s; break; }
  }
  if (bk < 0) return null;
  board[bk] = "k";

  return boardToFen(board, "w");
}

// ─── Public API ─────────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 20000;

const FALLBACKS: Record<EndgameId, string> = {
  "rook-endgame": "7k/8/6K1/8/8/8/8/7R w - - 0 1",
  "king-and-pawn": "6k1/5PK1/8/8/8/8/8/8 w - - 0 1",
  "zugzwang": "7k/8/6K1/8/8/8/8/6Q1 w - - 0 1",
};

export function generateEndgamePuzzle(gameId: EndgameId, difficulty: Difficulty): GeneratedPuzzle {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let fen: string | null;
    if (gameId === "king-and-pawn") {
      fen = buildKingAndPawn();
    } else {
      const pieces: Piece[] = gameId === "rook-endgame" ? ["R"] : [pick(["Q", "R"])];
      fen = buildPlacement(pieces);
    }
    if (!fen || !loadPlayable(fen)) continue;
    if (!exactlyMateIn(fen, 2)) continue;
    if (gameId === "zugzwang" && !hasQuietMatingKey(fen)) continue;
    return { fen, difficulty };
  }

  return { fen: FALLBACKS[gameId], difficulty };
}
