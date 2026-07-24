import MateGame from "../mate/MateGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import GameSeo from "@/app/components/GameSeo";
import { getLocale } from "@/app/i18n";

export const metadata = {
  title: "Rook Endgame Puzzle | King and Rook vs King",
  description: "Solve a rook endgame: use king and rook to cut off the enemy king and force checkmate. Free daily chess endgame puzzle.",
  keywords: ["rook endgame", "king rook vs king", "rook checkmate", "chess endgame puzzle", "rook endgame technique"],
  openGraph: {
    title: "Rook Endgame Puzzle | Chess Puzzles",
    description: "Use king and rook to cut off the enemy king and force checkmate. Free daily chess endgame puzzle.",
    url: "https://chesspuzzles.online/rook-endgame",
    images: [{ url: "/og-img.png", width: 1044, height: 1046, alt: "Chess Puzzles" }],
  },
};

export default async function RookEndgamePage() {
  const t = await getLocale();
  const { title, subtitle } = t.gamePages.rookEndgame;
  return (
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      <GameStartOverlay gameId="rook-endgame">
        <MateGame mateIn={2} slug="rook-endgame" />
      </GameStartOverlay>
      <HowToPlay title={t.howToPlay.sectionTitle} steps={t.howToPlay.rookEndgame} />
      <GameSeo
        name={title}
        description={subtitle}
        url="https://chesspuzzles.online/rook-endgame"
        steps={t.howToPlay.rookEndgame}
      />
    </div>
  );
}
