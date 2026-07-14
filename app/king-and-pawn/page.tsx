import MateGame from "../mate/MateGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import GameSeo from "@/app/components/GameSeo";
import { getLocale } from "@/app/i18n";

export const metadata = {
  title: "King and Pawn Endgame Puzzle | Promote and Checkmate",
  description: "Solve a king and pawn endgame: escort the pawn to promotion with the king's support and deliver checkmate. Free daily chess endgame puzzle.",
  keywords: ["king and pawn endgame", "pawn promotion puzzle", "chess endgame puzzle", "king pawn checkmate"],
  openGraph: {
    title: "King and Pawn Endgame Puzzle | Chess Puzzles",
    description: "Escort the pawn to promotion and deliver checkmate. Free daily chess endgame puzzle.",
    url: "https://dailycheckmate.com/king-and-pawn",
  },
};

export default async function KingAndPawnPage() {
  const t = await getLocale();
  const { title, subtitle } = t.gamePages.kingAndPawn;
  return (
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      <GameStartOverlay gameId="king-and-pawn">
        <MateGame mateIn={2} slug="king-and-pawn" />
      </GameStartOverlay>
      <HowToPlay title={t.howToPlay.sectionTitle} steps={t.howToPlay.kingAndPawn} />
      <GameSeo
        name={title}
        description={subtitle}
        url="https://dailycheckmate.com/king-and-pawn"
        steps={t.howToPlay.kingAndPawn}
      />
    </div>
  );
}
