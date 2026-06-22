import { readFile } from "fs/promises";
import path from "path";
import SolitaireGame from "./SolitaireGame";
import GameLeaderboard from "@/app/components/GameLeaderboard";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import type { PuzzleDef } from "./types";

export const metadata = { title: "DailyCheckmate — Chess Solitaire" };

export default async function ChessSolitairePage() {
  const file = await readFile(
    path.join(process.cwd(), "public", "games", "chess-solitaire.json"),
    "utf-8"
  );
  const puzzles: PuzzleDef[] = JSON.parse(file);
  return (
    <div>
      <h1 className="h4 mb-1">Chess Solitaire</h1>
      <p className="text-muted mb-4">Capture every piece, one legal move at a time.</p>
      <GameStartOverlay gameId="chess-solitaire">
        <SolitaireGame puzzles={puzzles} />
      </GameStartOverlay>
      <GameLeaderboard gameId="chess-solitaire" />
    </div>
  );
}
