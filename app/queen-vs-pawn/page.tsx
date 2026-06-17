import { readFile } from "fs/promises";
import path from "path";
import PawnHuntGame from "./PawnHuntGame";
import type { PawnPuzzle } from "./types";

export const metadata = {
  title: "Queen vs Pawn Puzzles — Chessful",
  description: "Stop a passed pawn from queening. Use the queen to pin and capture the pawn before it promotes. Free online chess endgame puzzles.",
};

export default async function QueenPawnPage() {
  const file = await readFile(
    path.join(process.cwd(), "public", "games", "queen-vs-pawn.json"),
    "utf-8"
  );
  const puzzles: PawnPuzzle[] = JSON.parse(file);
  return (
    <div>
      <h1 className="h4 mb-1">Queen vs Pawn</h1>
      <p className="text-muted mb-4">A passed pawn is one step from queening. Catch it with the queen before it promotes.</p>
      <PawnHuntGame puzzles={puzzles} />
    </div>
  );
}
