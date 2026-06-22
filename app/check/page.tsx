import { readFile } from "fs/promises";
import path from "path";
import CheckGame from "./CheckGame";
import GameLeaderboard from "@/app/components/GameLeaderboard";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import type { Puzzle } from "./types";

export const metadata = { title: "DailyCheckmate — Check" };

export default async function CheckPage() {
  const file = await readFile(
    path.join(process.cwd(), "public", "games", "check.json"),
    "utf-8"
  );
  const puzzles: Puzzle[] = JSON.parse(file);
  return (
    <div>
      <h1 className="h4 mb-1">Check</h1>
      <p className="text-muted mb-4">Deliver checkmate on the mini board within the move limit.</p>
      <GameStartOverlay gameId="check">
        <CheckGame puzzles={puzzles} />
      </GameStartOverlay>
      <GameLeaderboard gameId="check" />
    </div>
  );
}
