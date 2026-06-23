import { readFile } from "fs/promises";
import path from "path";
import TakesGame from "./TakesGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import { getLocale } from "@/app/i18n";
import type { Puzzle } from "./types";

export const metadata = { title: "DailyCheckmate — Takes" };

export default async function TakesPage() {
  const file = await readFile(path.join(process.cwd(), "public", "games", "takes.json"), "utf-8");
  const t = await getLocale();
  const puzzle: Puzzle = JSON.parse(file);
  const { title, subtitle } = t.gamePages.takes;
  return (
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      <GameStartOverlay gameId="takes">
        <TakesGame puzzle={puzzle} />
      </GameStartOverlay>
      <HowToPlay title={t.howToPlay.sectionTitle} steps={t.howToPlay.takes} />
    </div>
  );
}
