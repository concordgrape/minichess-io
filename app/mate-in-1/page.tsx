import { readFile } from "fs/promises";
import path from "path";
import MateGame from "../mate/MateGame";
// import GameLeaderboard from "@/app/components/GameLeaderboard";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import type { MatePuzzle } from "../mate/types";

export const metadata = {
  title: "Mate in 1 Puzzles — DailyCheckmate",
  description: "Solve mate in 1 chess puzzles. Find the one move that delivers checkmate. Free online chess puzzles for all levels.",
};

export default async function MateIn1Page() {
  const file = await readFile(
    path.join(process.cwd(), "public", "games", "mate-in-1.json"),
    "utf-8"
  );
  const puzzle = JSON.parse(file);
  return (
    <div>
      <h1 className="h4 mb-1">Mate in 1</h1>
      <p className="text-muted mb-4">Find the single move that delivers checkmate.</p>
      <GameStartOverlay gameId="mate-in-1">
        <MateGame puzzle={puzzle} mateIn={1} slug="mate-in-1" />
      </GameStartOverlay>
{/*       <GameLeaderboard gameId="mate-in-1" />*/}
    </div>
  );
}
