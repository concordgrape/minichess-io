import type { Piece, PieceType } from "./types";

const IN_BOUNDS = (r: number, c: number) => r >= 0 && r < 4 && c >= 0 && c < 4;

function pieceAt(pieces: Piece[], row: number, col: number): Piece | undefined {
  return pieces.find((p) => p.row === row && p.col === col);
}

/** Returns all pieces that `piece` can legally capture given the current board. */
export function getLegalCaptures(piece: Piece, pieces: Piece[]): Piece[] {
  const targets: Piece[] = [];

  const addIfCaptureable = (row: number, col: number) => {
    const target = pieceAt(pieces, row, col);
    if (target && target.id !== piece.id && target.type !== "k") {
      targets.push(target);
      return true; // occupied
    }
    return target !== undefined; // occupied but king — blocked
  };

  const slideCaptures = (dirs: [number, number][]) => {
    for (const [dr, dc] of dirs) {
      let r = piece.row + dr, c = piece.col + dc;
      while (IN_BOUNDS(r, c)) {
        const target = pieceAt(pieces, r, c);
        if (target) {
          if (target.type !== "k") targets.push(target);
          break; // blocked either way
        }
        r += dr; c += dc;
      }
    }
  };

  switch (piece.type as PieceType) {
    case "p":
      // Captures diagonally in all 4 directions
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
        const r = piece.row + dr, c = piece.col + dc;
        if (IN_BOUNDS(r, c)) addIfCaptureable(r, c);
      }
      break;

    case "n":
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const r = piece.row + dr, c = piece.col + dc;
        if (IN_BOUNDS(r, c)) addIfCaptureable(r, c);
      }
      break;

    case "r":
      slideCaptures([[-1,0],[1,0],[0,-1],[0,1]]);
      break;

    case "b":
      slideCaptures([[-1,-1],[-1,1],[1,-1],[1,1]]);
      break;

    case "q":
      slideCaptures([[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]);
      break;

    case "k":
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) {
        const r = piece.row + dr, c = piece.col + dc;
        if (IN_BOUNDS(r, c)) addIfCaptureable(r, c);
      }
      break;
  }

  return targets;
}

/** Returns true if any non-king piece has a legal capture. */
export function hasAnyCapture(pieces: Piece[]): boolean {
  return pieces.some(
    (p) => p.type !== "k" && getLegalCaptures(p, pieces).length > 0
  );
}

/** Apply a capture: move `attacker` to `target`'s square, remove `target`. */
export function applyCapture(
  pieces: Piece[],
  attackerId: string,
  targetId: string
): Piece[] {
  const attacker = pieces.find((p) => p.id === attackerId)!;
  const target = pieces.find((p) => p.id === targetId)!;
  return pieces
    .filter((p) => p.id !== targetId)
    .map((p) =>
      p.id === attackerId ? { ...p, row: target.row, col: target.col } : p
    );
}
