import MateGame from "../mate/MateGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import { getLocale } from "@/app/i18n";

export const metadata = {
  title: "Mate in 2 Chess Puzzles | Force Checkmate in Two Moves",
  description: "Solve mate in 2 chess puzzles. Force checkmate in two moves against the best defense. Free daily chess tactics training.",
  keywords: ["mate in 2", "mate in two", "checkmate in two moves", "chess puzzles", "chess tactics training"],
  openGraph: {
    title: "Mate in 2 Chess Puzzles | Daily Checkmate",
    description: "Force checkmate in two moves against the best defense. Free daily chess tactics training.",
    url: "https://dailycheckmate.com/mate-in-2",
  },
};

export default async function MateIn2Page() {
  const t = await getLocale();
  const { title, subtitle } = t.gamePages.mateIn2;
  return (
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      <GameStartOverlay gameId="mate-in-2">
        <MateGame mateIn={2} slug="mate-in-2" />
      </GameStartOverlay>
      <HowToPlay title={t.howToPlay.sectionTitle} steps={t.howToPlay.mateIn2} />
    </div>
  );
}
