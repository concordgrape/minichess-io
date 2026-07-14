import PawnHuntGame from "./PawnHuntGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import { getLocale } from "@/app/i18n";

export const metadata = {
  title: "Queen vs Pawn Puzzle | Stop the Passed Pawn",
  description: "Stop a passed pawn from promoting with just your queen. A precise daily chess endgame puzzle that tests queen technique. Free online.",
  keywords: ["queen vs pawn", "queen versus pawn endgame", "stop passed pawn chess", "chess endgame puzzle"],
  openGraph: {
    title: "Queen vs Pawn Puzzle | Chess Puzzles",
    description: "Stop a passed pawn from promoting with just your queen. Tests precise queen technique.",
    url: "https://dailycheckmate.com/queen-vs-pawn",
  },
};

export default async function QueenPawnPage() {
  const t = await getLocale();
  const { title, subtitle } = t.gamePages.queenVsPawn;
  return (
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      <GameStartOverlay gameId="queen-vs-pawn">
        <PawnHuntGame />
      </GameStartOverlay>
      <HowToPlay title={t.howToPlay.sectionTitle} steps={t.howToPlay.queenVsPawn} />
    </div>
  );
}
