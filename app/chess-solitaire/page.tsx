import { readFile } from "fs/promises";
import path from "path";
import SolitaireGame from "./SolitaireGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import { getLocale } from "@/app/i18n";
import type { PuzzleDef } from "./types";

export const metadata = { title: "DailyCheckmate — Chess Solitaire" };

export default async function ChessSolitairePage() {
  const file = await readFile(path.join(process.cwd(), "public", "games", "chess-solitaire.json"), "utf-8");
  const t = await getLocale();
  const puzzle = JSON.parse(file);
  const { title, subtitle } = t.gamePages.chessSolitaire;
  return (
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      <GameStartOverlay gameId="chess-solitaire">
        <SolitaireGame puzzle={puzzle} />
      </GameStartOverlay>
      <HowToPlay title={t.howToPlay.sectionTitle} steps={t.howToPlay.chessSolitaire} />
    </div>
  );
}
