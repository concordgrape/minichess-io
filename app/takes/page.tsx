import TakesGame from "./TakesGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import GameSeo from "@/app/components/GameSeo";
import { getLocale } from "@/app/i18n";

export const metadata = {
  title: "Takes | Capture All Pieces Chess Puzzle",
  description: "Capture every piece on the board in the right order. A daily chess puzzle where sequence is everything. Free to play online.",
  keywords: ["chess capture puzzle", "takes chess game", "capture all pieces chess", "daily chess puzzle"],
  openGraph: {
    title: "Takes | Capture All Pieces Chess Puzzle | Chess Puzzles",
    description: "Capture every piece on the board in the right order. A daily chess puzzle where sequence is everything.",
    url: "https://chesspuzzles.online/takes",
  },
};

export default async function TakesPage() {
  const t = await getLocale();
  const { title, subtitle } = t.gamePages.takes;
  return (
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      <GameStartOverlay gameId="takes">
        <TakesGame />
      </GameStartOverlay>
      <HowToPlay title={t.howToPlay.sectionTitle} steps={t.howToPlay.takes} />
      <GameSeo
        name={title}
        description={subtitle}
        url="https://chesspuzzles.online/takes"
        steps={t.howToPlay.takes}
      />
    </div>
  );
}
