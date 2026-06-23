import { readFile } from "fs/promises";
import path from "path";
import SolitaireGame from "./SolitaireGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import { getLocale } from "@/app/i18n";
import type { Puzzle } from "./types";

export const metadata = { title: "DailyCheckmate — Chain Capture" };

export default async function SolitairePage() {
  const file = await readFile(path.join(process.cwd(), "public", "games", "solitaire.json"), "utf-8");
  const t = await getLocale();
  const puzzle = JSON.parse(file);
  const { title, subtitle } = t.gamePages.solitaire;
  return (
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      <GameStartOverlay gameId="solitaire">
        <SolitaireGame puzzle={puzzle} />
      </GameStartOverlay>
      <HowToPlay title={t.howToPlay.sectionTitle} steps={t.howToPlay.solitaire} />
    </div>
  );
}
