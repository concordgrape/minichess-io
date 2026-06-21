import { readFile } from "fs/promises";
import path from "path";
import MateGame from "../mate/MateGame";
import type { MatePuzzle } from "../mate/types";

export const metadata = {
  title: "Zugzwang Endgame Puzzle — DailyCheckmate",
  description: "Solve a zugzwang chess puzzle: find the quiet waiting move that leaves the opponent with no good reply, then checkmate. Free online endgame puzzle.",
};

export default async function ZugzwangPage() {
  const file = await readFile(
    path.join(process.cwd(), "public", "games", "zugzwang.json"),
    "utf-8"
  );
  const puzzles: MatePuzzle[] = JSON.parse(file);
  return (
    <div>
      <h1 className="h4 mb-1">Zugzwang</h1>
      <p className="text-muted mb-4">Find the quiet waiting move that forces Black into a losing reply, then mate.</p>
      <MateGame puzzles={puzzles} mateIn={2} slug="zugzwang" />
    </div>
  );
}
