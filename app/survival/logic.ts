export type PieceType = "N";

export interface Pawn { id: string; row: number; col: number; }
export interface Pos  { row: number; col: number; }

const SIZE = 4;
const IN_BOUNDS = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;

/** Squares the player piece can capture (pawns reachable from pos). */
export function getCaptures(type: PieceType, pos: Pos, pawns: Pawn[]): Pos[] {
  const pawnSet = new Set(pawns.map((p) => `${p.row},${p.col}`));
  const captures: Pos[] = [];

  const slideCaptures = (dirs: [number, number][]) => {
    for (const [dr, dc] of dirs) {
      let r = pos.row + dr, c = pos.col + dc;
      while (IN_BOUNDS(r, c)) {
        if (pawnSet.has(`${r},${c}`)) { captures.push({ row: r, col: c }); break; }
        r += dr; c += dc;
      }
    }
  };

  switch (type) {
    case "N":
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const r = pos.row + dr, c = pos.col + dc;
        if (IN_BOUNDS(r, c) && pawnSet.has(`${r},${c}`)) captures.push({ row: r, col: c });
      }
      break;
    case "R": slideCaptures([[-1,0],[1,0],[0,-1],[0,1]]); break;
    case "B": slideCaptures([[-1,-1],[-1,1],[1,-1],[1,1]]); break;
    case "Q": slideCaptures([[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]); break;
  }
  return captures;
}

/** Spawn N pawns on random empty squares (not player pos). */
export function spawnPawns(
  count: number,
  existing: Pawn[],
  playerPos: Pos,
  nextId: () => string
): Pawn[] {
  const occupied = new Set([
    ...existing.map((p) => `${p.row},${p.col}`),
    `${playerPos.row},${playerPos.col}`,
  ]);
  const empty: Pos[] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (!occupied.has(`${r},${c}`)) empty.push({ row: r, col: c });

  const spawned: Pawn[] = [];
  for (let i = 0; i < Math.min(count, empty.length); i++) {
    const idx = Math.floor(Math.random() * empty.length);
    const [sq] = empty.splice(idx, 1);
    spawned.push({ id: nextId(), ...sq });
  }
  return spawned;
}

/** How many pawns spawn after each capture based on score. */
export function spawnCount(score: number): number {
  if (score >= 30) return 3;
  if (score >= 15) return 2;
  return 1;
}
