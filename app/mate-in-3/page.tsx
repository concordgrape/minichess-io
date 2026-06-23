import { readFile } from "fs/promises";
import path from "path";
import MateGame from "../mate/MateGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import { getLocale } from "@/app/i18n";
import type { MatePuzzle } from "../mate/types";

export const metadata = {
  title: "Mate in 3 Chess Puzzles — Calculate Checkmate in Three Moves",
  description: "Solve mate in 3 chess puzzles. Calculate a forced checkmate in three moves against the best defense. Free daily chess puzzles.",
  keywords: ["mate in 3", "mate in three", "checkmate in three moves", "chess puzzles", "chess calculation"],
  openGraph: {
    title: "Mate in 3 Chess Puzzles | DailyCheckmate",
    description: "Calculate a forced checkmate in three moves against the best defense. Free daily chess puzzles.",
    url: "https://dailycheckmate.com/mate-in-3",
  },
};

export default async function MateIn3Page() {
  const file = await readFile(path.join(process.cwd(), "public", "games", "mate-in-3.json"), "utf-8");
  const t = await getLocale();
  const puzzle = JSON.parse(file);
  const { title, subtitle } = t.gamePages.mateIn3;
  return (
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      <GameStartOverlay gameId="mate-in-3">
        <MateGame puzzle={puzzle} mateIn={3} slug="mate-in-3" />
      </GameStartOverlay>
      <HowToPlay title={t.howToPlay.sectionTitle} steps={t.howToPlay.mateIn3} />
    </div>
  );
}
