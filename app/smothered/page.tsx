import { readFile } from "fs/promises";
import path from "path";
import SmotheredGame from "./SmotheredGame";
import type { Puzzle } from "./types";

export const metadata = { title: "Chessful — Smothered" };

export default async function SmotheredPage() {
  const file = await readFile(
    path.join(process.cwd(), "public", "games", "smothered.json"),
    "utf-8"
  );
  const puzzles: Puzzle[] = JSON.parse(file);
  return (
    <div>
      <h1 className="h4 mb-1">Smothered</h1>
      <p className="text-muted mb-4">Trap the king with its own pieces and deliver a smothered mate.</p>
      <SmotheredGame puzzles={puzzles} />
    </div>
  );
}
