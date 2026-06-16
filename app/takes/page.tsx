import { readFile } from "fs/promises";
import path from "path";
import TakesGame from "./TakesGame";
import type { Puzzle } from "./types";

export const metadata = { title: "MiniChess.io — Takes" };

export default async function TakesPage() {
  const file = await readFile(
    path.join(process.cwd(), "public", "takes-puzzles.json"),
    "utf-8"
  );
  const puzzles: Puzzle[] = JSON.parse(file);

  return (
    <div>
      <h1 className="h4 mb-1">Takes</h1>
      <p className="text-muted mb-4">Capture every piece — find the right order to clear the board.</p>
      <TakesGame puzzles={puzzles} />
    </div>
  );
}
