import { readFile } from "fs/promises";
import path from "path";
import MateGame from "../mate/MateGame";
import type { MatePuzzle } from "../mate/types";

export const metadata = {
  title: "Mate in 3 Puzzles — Chessful",
  description: "Solve mate in 3 chess puzzles. Calculate a forced checkmate in three moves against the best defense. Free online chess puzzles.",
};

export default async function MateIn3Page() {
  const file = await readFile(
    path.join(process.cwd(), "public", "games", "mate-in-3.json"),
    "utf-8"
  );
  const puzzles: MatePuzzle[] = JSON.parse(file);
  return (
    <div>
      <h1 className="h4 mb-1">Mate in 3</h1>
      <p className="text-muted mb-4">Calculate a forced checkmate in three moves.</p>
      <MateGame puzzles={puzzles} mateIn={3} slug="mate-in-3" />
    </div>
  );
}
