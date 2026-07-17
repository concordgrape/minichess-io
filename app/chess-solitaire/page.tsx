import SolitaireGame from "./SolitaireGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import GameSeo from "@/app/components/GameSeo";
import { getLocale } from "@/app/i18n";

export const metadata = {
  title: "Chess Solitaire | Capture All Pieces on the Full Board",
  description: "Capture every piece on a full 8x8 chess board in one continuous sequence. A daily chess puzzle for all skill levels. Free online.",
  keywords: ["chess solitaire", "chess solitaire puzzle", "capture all pieces chess", "daily chess puzzle"],
  openGraph: {
    title: "Chess Solitaire | Capture All Pieces | Chess Puzzles",
    description: "Capture every piece on a full 8x8 chess board in one continuous sequence.",
    url: "https://chesspuzzles.online/chess-solitaire",
  },
};

export default async function ChessSolitairePage() {
  const t = await getLocale();
  const { title, subtitle } = t.gamePages.chessSolitaire;
  return (
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      <GameStartOverlay gameId="chess-solitaire">
        <SolitaireGame />
      </GameStartOverlay>
      <HowToPlay title={t.howToPlay.sectionTitle} steps={t.howToPlay.chessSolitaire} />
      <GameSeo
        name={title}
        description={subtitle}
        url="https://chesspuzzles.online/chess-solitaire"
        steps={t.howToPlay.chessSolitaire}
      />
    </div>
  );
}
