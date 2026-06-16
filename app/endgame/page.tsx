import { readFile } from "fs/promises";
import path from "path";
import MateGame from "../mate/MateGame";
import type { MatePuzzle } from "../mate/types";

export const metadata = {
  title: "Endgame Puzzles — MiniChess.io",
  description: "Solve chess endgame puzzles: king and pawn promotion and rook checkmate technique. Force the win in two moves. Free online endgame training.",
};

export default async function EndgamePage() {
  const file = await readFile(
    path.join(process.cwd(), "public", "endgame-puzzles.json"),
    "utf-8"
  );
  const puzzles: MatePuzzle[] = JSON.parse(file);
  return (
    <div>
      <h1 className="h4 mb-1">Endgame Puzzles</h1>
      <p className="text-muted mb-4">Convert basic endgames — promote the pawn or drive the king to the edge with the rook — and finish in two moves.</p>
      <MateGame puzzles={puzzles} mateIn={2} />
    </div>
  );
}
