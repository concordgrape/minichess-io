import type { SolitairePiece, PieceType } from "./types";

const SIZE = 8;
const IN = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;

function occupied(pieces: SolitairePiece[], r: number, c: number): SolitairePiece | undefined {
  return pieces.find((p) => p.row === r && p.col === c);
}

function slide(
  piece: SolitairePiece,
  pieces: SolitairePiece[],
  dirs: [number, number][]
): SolitairePiece[] {
  const targets: SolitairePiece[] = [];
  for (const [dr, dc] of dirs) {
    let r = piece.row + dr, c = piece.col + dc;
    while (IN(r, c)) {
      const hit = occupied(pieces, r, c);
      if (hit) { targets.push(hit); break; }
      r += dr; c += dc;
    }
  }
  return targets;
}

/** All pieces that `piece` can legally capture on the current board. */
export function getLegalCaptures(piece: SolitairePiece, pieces: SolitairePiece[]): SolitairePiece[] {
  const others = pieces.filter((p) => p.id !== piece.id);

  switch (piece.type as PieceType) {
    case "P": {
      // White pawns capture forward (row decreases), black capture backward (row increases)
      const dr = piece.color === "w" ? -1 : 1;
      return [-1, 1]
        .map((dc) => occupied(others, piece.row + dr, piece.col + dc))
        .filter(Boolean) as SolitairePiece[];
    }
    case "N": {
      const moves: SolitairePiece[] = [];
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const hit = occupied(others, piece.row + dr, piece.col + dc);
        if (hit) moves.push(hit);
      }
      return moves;
    }
    case "B": return slide(piece, others, [[-1,-1],[-1,1],[1,-1],[1,1]]);
    case "R": return slide(piece, others, [[-1,0],[1,0],[0,-1],[0,1]]);
    case "Q": return slide(piece, others, [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]);
    case "K": {
      const moves: SolitairePiece[] = [];
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) {
        const hit = occupied(others, piece.row + dr, piece.col + dc);
        if (hit) moves.push(hit);
      }
      return moves;
    }
    default: return [];
  }
}

export function hasAnyCapture(pieces: SolitairePiece[]): boolean {
  return pieces.some((p) => getLegalCaptures(p, pieces).length > 0);
}

export function applyCapture(
  pieces: SolitairePiece[],
  attackerId: string,
  targetId: string
): SolitairePiece[] {
  const attacker = pieces.find((p) => p.id === attackerId)!;
  const target = pieces.find((p) => p.id === targetId)!;
  return pieces
    .filter((p) => p.id !== targetId)
    .map((p) => p.id === attackerId ? { ...p, row: target.row, col: target.col } : p);
}

/** DFS solver — returns true if puzzle is solvable from this state. */
export function isSolvable(pieces: SolitairePiece[]): boolean {
  if (pieces.length === 1) return true;
  if (!hasAnyCapture(pieces)) return false;
  for (const piece of pieces) {
    for (const target of getLegalCaptures(piece, pieces)) {
      if (isSolvable(applyCapture(pieces, piece.id, target.id))) return true;
    }
  }
  return false;
}
