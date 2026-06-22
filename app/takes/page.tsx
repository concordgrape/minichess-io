import { readFile } from "fs/promises";
import path from "path";
import TakesGame from "./TakesGame";
import GameLeaderboard from "@/app/components/GameLeaderboard";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import type { Puzzle } from "./types";

export const metadata = { title: "DailyCheckmate — Takes" };

export default async function TakesPage() {
  const file = await readFile(
    path.join(process.cwd(), "public", "games", "takes.json"),
    "utf-8"
  );
  const puzzles: Puzzle[] = JSON.parse(file);
  return (
    <div>
      <h1 className="h4 mb-1">Takes</h1>
      <p className="text-muted mb-4">Capture every piece — find the right order to clear the board.</p>
      <GameStartOverlay gameId="takes">
        <TakesGame puzzles={puzzles} />
      </GameStartOverlay>
      <GameLeaderboard gameId="takes" />
    </div>
  );
}
