import CheckGame from "./CheckGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import { getLocale } from "@/app/i18n";

export const metadata = {
  title: "Check Puzzle | Give Check Without Losing Your Piece",
  description: "Find the move that puts the king in check while keeping your piece safe. A daily chess tactics puzzle. Free to play online.",
  keywords: ["chess check puzzle", "give check chess", "chess tactics puzzle", "daily chess puzzle"],
  openGraph: {
    title: "Check Puzzle | Give Check Without Losing Your Piece | Chess Puzzles",
    description: "Find the move that puts the king in check while keeping your piece safe.",
    url: "https://dailycheckmate.com/check",
  },
};

export default async function CheckPage() {
  const t = await getLocale();
  const { title, subtitle } = t.gamePages.check;
  return (
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      <GameStartOverlay gameId="check">
        <CheckGame />
      </GameStartOverlay>
      <HowToPlay title={t.howToPlay.sectionTitle} steps={t.howToPlay.check} />
    </div>
  );
}
