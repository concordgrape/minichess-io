import { readFile } from "fs/promises";
import path from "path";
import MateGame from "../mate/MateGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import { getLocale } from "@/app/i18n";
import type { MatePuzzle } from "../mate/types";

export const metadata = {
  title: "King and Pawn Endgame Puzzle — DailyCheckmate",
  description: "Solve a king and pawn endgame: promote the pawn with the king's support and deliver checkmate. Free online chess endgame puzzle.",
};

export default async function KingAndPawnPage() {
  const file = await readFile(path.join(process.cwd(), "public", "games", "king-and-pawn.json"), "utf-8");
  const t = await getLocale();
  const puzzle = JSON.parse(file);
  const { title, subtitle } = t.gamePages.kingAndPawn;
  return (
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      <GameStartOverlay gameId="king-and-pawn">
        <MateGame puzzle={puzzle} mateIn={2} slug="king-and-pawn" />
      </GameStartOverlay>
      <HowToPlay title={t.howToPlay.sectionTitle} steps={t.howToPlay.kingAndPawn} />
    </div>
  );
}
