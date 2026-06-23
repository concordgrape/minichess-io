import { readFile } from "fs/promises";
import path from "path";
import PawnHuntGame from "./PawnHuntGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import { getLocale } from "@/app/i18n";
import type { PawnPuzzle } from "./types";

export const metadata = {
  title: "Queen vs Pawn Puzzles — DailyCheckmate",
  description: "Stop a passed pawn from queening. Use the queen to pin and capture the pawn before it promotes. Free online chess endgame puzzles.",
};

export default async function QueenPawnPage() {
  const file = await readFile(path.join(process.cwd(), "public", "games", "queen-vs-pawn.json"), "utf-8");
  const t = await getLocale();
  const puzzle = JSON.parse(file);
  const { title, subtitle } = t.gamePages.queenVsPawn;
  return (
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      <GameStartOverlay gameId="queen-vs-pawn">
        <PawnHuntGame puzzle={puzzle} />
      </GameStartOverlay>
      <HowToPlay title={t.howToPlay.sectionTitle} steps={t.howToPlay.queenVsPawn} />
    </div>
  );
}
