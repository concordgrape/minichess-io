import SolitaireGame from "./SolitaireGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import GameSeo from "@/app/components/GameSeo";
import { getLocale } from "@/app/i18n";

export const metadata = {
  title: "Chain Capture | Chess Puzzle Game",
  description: "Capture every piece on the board in one unbroken chain. A daily chess puzzle that trains calculation and piece mobility. Free online.",
  keywords: ["chain capture chess", "chess capture chain puzzle", "chess solitaire puzzle", "daily chess puzzle"],
  openGraph: {
    title: "Chain Capture | Chess Puzzle Game | Chess Puzzles",
    description: "Capture every piece on the board in one unbroken chain. Trains calculation and piece mobility.",
    url: "https://chesspuzzles.online/solitaire",
    images: [{ url: "/og-img.png", width: 1044, height: 1046, alt: "Chess Puzzles" }],
  },
};

export default async function SolitairePage() {
  const t = await getLocale();
  const { title, subtitle } = t.gamePages.solitaire;
  return (
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      <GameStartOverlay gameId="solitaire">
        <SolitaireGame />
      </GameStartOverlay>
      <HowToPlay title={t.howToPlay.sectionTitle} steps={t.howToPlay.solitaire} />
      <GameSeo
        name={title}
        description={subtitle}
        url="https://chesspuzzles.online/solitaire"
        steps={t.howToPlay.solitaire}
      />
    </div>
  );
}
