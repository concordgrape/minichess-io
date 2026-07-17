import MateGame from "../mate/MateGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import GameSeo from "@/app/components/GameSeo";
import { getLocale } from "@/app/i18n";

export const metadata = {
  title: "Zugzwang Puzzle | Force Your Opponent Into a Losing Move",
  description: "Solve a zugzwang chess puzzle: find the quiet waiting move that forces your opponent into a losing position. Free daily chess endgame puzzle.",
  keywords: ["zugzwang", "zugzwang chess puzzle", "chess waiting move", "chess endgame puzzle", "chess strategy"],
  openGraph: {
    title: "Zugzwang Puzzle | Chess Puzzles",
    description: "Find the quiet waiting move that forces your opponent into a losing position. Free daily chess endgame puzzle.",
    url: "https://chesspuzzles.online/zugzwang",
  },
};

export default async function ZugzwangPage() {
  const t = await getLocale();
  const { title, subtitle } = t.gamePages.zugzwang;
  return (
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      <GameStartOverlay gameId="zugzwang">
        <MateGame mateIn={2} slug="zugzwang" />
      </GameStartOverlay>
      <HowToPlay title={t.howToPlay.sectionTitle} steps={t.howToPlay.zugzwang} />
      <GameSeo
        name={title}
        description={subtitle}
        url="https://chesspuzzles.online/zugzwang"
        steps={t.howToPlay.zugzwang}
      />
    </div>
  );
}
