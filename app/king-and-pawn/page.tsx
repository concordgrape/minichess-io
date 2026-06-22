import { readFile } from "fs/promises";
import path from "path";
import MateGame from "../mate/MateGame";
// import GameLeaderboard from "@/app/components/GameLeaderboard";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import type { MatePuzzle } from "../mate/types";

export const metadata = {
  title: "King and Pawn Endgame Puzzle — DailyCheckmate",
  description: "Solve a king and pawn endgame: promote the pawn with the king's support and deliver checkmate. Free online chess endgame puzzle.",
};

export default async function KingAndPawnPage() {
  const file = await readFile(
    path.join(process.cwd(), "public", "games", "king-and-pawn.json"),
    "utf-8"
  );
  const puzzle = JSON.parse(file);
  return (
    <div>
      <h1 className="h4 mb-1">King and Pawn</h1>
      <p className="text-muted mb-4">Promote the pawn with your king&apos;s support, then deliver checkmate.</p>
      <GameStartOverlay gameId="king-and-pawn">
        <MateGame puzzle={puzzle} mateIn={2} slug="king-and-pawn" />
      </GameStartOverlay>
{/*       <GameLeaderboard gameId="king-and-pawn" />*/}
    </div>
  );
}
