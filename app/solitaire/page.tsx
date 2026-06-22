import { readFile } from "fs/promises";
import path from "path";
import SolitaireGame from "./SolitaireGame";
// import GameLeaderboard from "@/app/components/GameLeaderboard";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import type { Puzzle } from "./types";

export const metadata = { title: "DailyCheckmate — Chain Capture" };

export default async function SolitairePage() {
  const file = await readFile(
    path.join(process.cwd(), "public", "games", "solitaire.json"),
    "utf-8"
  );
  const puzzle = JSON.parse(file);
  return (
    <div>
      <h1 className="h4 mb-1">Chain Capture</h1>
      <p className="text-muted mb-4">Clear the board in one unbroken chain of captures.</p>
      <GameStartOverlay gameId="solitaire">
        <SolitaireGame puzzle={puzzle} />
      </GameStartOverlay>
{/*       <GameLeaderboard gameId="solitaire" />*/}
    </div>
  );
}
