import { readFile } from "fs/promises";
import path from "path";
import PawnHuntGame from "./PawnHuntGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import { getLocale } from "@/app/i18n";
import type { PawnPuzzle } from "./types";

export const metadata = {
  title: "Queen vs Pawn Puzzle — Stop the Passed Pawn",
  description: "Stop a passed pawn from promoting with just your queen. A precise daily chess endgame puzzle that tests queen technique. Free online.",
  keywords: ["queen vs pawn", "queen versus pawn endgame", "stop passed pawn chess", "chess endgame puzzle"],
  openGraph: {
    title: "Queen vs Pawn Puzzle | DailyCheckmate",
    description: "Stop a passed pawn from promoting with just your queen. Tests precise queen technique.",
    url: "https://dailycheckmate.com/queen-vs-pawn",
  },
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
