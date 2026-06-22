import { readFile } from "fs/promises";
import path from "path";
import MateGame from "../mate/MateGame";
// import GameLeaderboard from "@/app/components/GameLeaderboard";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import type { MatePuzzle } from "../mate/types";

export const metadata = {
  title: "Rook Endgame Puzzle — DailyCheckmate",
  description: "Solve a king and rook versus king endgame: cut off the king with the rook and checkmate. Free online chess endgame puzzle.",
};

export default async function RookEndgamePage() {
  const file = await readFile(
    path.join(process.cwd(), "public", "games", "rook-endgame.json"),
    "utf-8"
  );
  const puzzle = JSON.parse(file);
  return (
    <div>
      <h1 className="h4 mb-1">Rook Endgame</h1>
      <p className="text-muted mb-4">Cut off the king with the rook and bring your king up to deliver mate.</p>
      <GameStartOverlay gameId="rook-endgame">
        <MateGame puzzle={puzzle} mateIn={2} slug="rook-endgame" />
      </GameStartOverlay>
{/*       <GameLeaderboard gameId="rook-endgame" />*/}
    </div>
  );
}
