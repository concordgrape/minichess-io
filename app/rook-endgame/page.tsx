import { readFile } from "fs/promises";
import path from "path";
import MateGame from "../mate/MateGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import { getLocale } from "@/app/i18n";
import type { MatePuzzle } from "../mate/types";

export const metadata = {
  title: "Rook Endgame Puzzle — King and Rook vs King",
  description: "Solve a rook endgame: use king and rook to cut off the enemy king and force checkmate. Free daily chess endgame puzzle.",
  keywords: ["rook endgame", "king rook vs king", "rook checkmate", "chess endgame puzzle", "rook endgame technique"],
  openGraph: {
    title: "Rook Endgame Puzzle | DailyCheckmate",
    description: "Use king and rook to cut off the enemy king and force checkmate. Free daily chess endgame puzzle.",
    url: "https://dailycheckmate.com/rook-endgame",
  },
};

export default async function RookEndgamePage() {
  const file = await readFile(path.join(process.cwd(), "public", "games", "rook-endgame.json"), "utf-8");
  const t = await getLocale();
  const puzzle = JSON.parse(file);
  const { title, subtitle } = t.gamePages.rookEndgame;
  return (
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      <GameStartOverlay gameId="rook-endgame">
        <MateGame puzzle={puzzle} mateIn={2} slug="rook-endgame" />
      </GameStartOverlay>
      <HowToPlay title={t.howToPlay.sectionTitle} steps={t.howToPlay.rookEndgame} />
    </div>
  );
}
