import { readFile } from "fs/promises";
import path from "path";
import MateGame from "../mate/MateGame";
import type { MatePuzzle } from "../mate/types";

export const metadata = {
  title: "Mate in 2 Puzzles — DailyCheckmate",
  description: "Solve mate in 2 chess puzzles. Force checkmate in two moves against the best defense. Free online chess tactics training.",
};

export default async function MateIn2Page() {
  const file = await readFile(
    path.join(process.cwd(), "public", "games", "mate-in-2.json"),
    "utf-8"
  );
  const puzzles: MatePuzzle[] = JSON.parse(file);
  return (
    <div>
      <h1 className="h4 mb-1">Mate in 2</h1>
      <p className="text-muted mb-4">Force checkmate in two moves against Black&apos;s best defense.</p>
      <MateGame puzzles={puzzles} mateIn={2} slug="mate-in-2" />
    </div>
  );
}
