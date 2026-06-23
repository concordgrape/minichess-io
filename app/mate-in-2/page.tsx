import { readFile } from "fs/promises";
import path from "path";
import MateGame from "../mate/MateGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import { getLocale } from "@/app/i18n";
import type { MatePuzzle } from "../mate/types";

export const metadata = {
  title: "Mate in 2 Puzzles — DailyCheckmate",
  description: "Solve mate in 2 chess puzzles. Force checkmate in two moves against the best defense. Free online chess tactics training.",
};

export default async function MateIn2Page() {
  const file = await readFile(path.join(process.cwd(), "public", "games", "mate-in-2.json"), "utf-8");
  const t = await getLocale();
  const puzzle = JSON.parse(file);
  const { title, subtitle } = t.gamePages.mateIn2;
  return (
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      <GameStartOverlay gameId="mate-in-2">
        <MateGame puzzle={puzzle} mateIn={2} slug="mate-in-2" />
      </GameStartOverlay>
      <HowToPlay title={t.howToPlay.sectionTitle} steps={t.howToPlay.mateIn2} />
    </div>
  );
}
