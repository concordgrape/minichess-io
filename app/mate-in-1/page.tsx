import MateGame from "../mate/MateGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import GameSeo from "@/app/components/GameSeo";
import { getLocale } from "@/app/i18n";

export const metadata = {
  title: "Mate in 1 Chess Puzzles | Find Checkmate in One Move",
  description: "Solve mate in 1 chess puzzles. Find the one move that delivers checkmate. Free daily chess tactics for all skill levels.",
  keywords: ["mate in 1", "mate in one", "checkmate in one move", "chess puzzles", "chess tactics"],
  openGraph: {
    title: "Mate in 1 Chess Puzzles | Chess Puzzles",
    description: "Find the one move that delivers checkmate. Free daily chess tactics for all skill levels.",
    url: "https://dailycheckmate.com/mate-in-1",
    images: [{ url: "/images/mate_in_1.webp", alt: "Mate in 1 Chess Puzzles" }],
  },
};

export default async function MateIn1Page() {
  const t = await getLocale();
  const { title, subtitle } = t.gamePages.mateIn1;
  return (
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      <GameStartOverlay gameId="mate-in-1">
        <MateGame mateIn={1} slug="mate-in-1" />
      </GameStartOverlay>
      <HowToPlay title={t.howToPlay.sectionTitle} steps={t.howToPlay.mateIn1} />
      <GameSeo
        name={title}
        description={subtitle}
        url="https://dailycheckmate.com/mate-in-1"
        steps={t.howToPlay.mateIn1}
        guide={{ href: "/blog/mate-in-1", title: "How to Solve Mate in 1 Puzzles Every Time" }}
      />
    </div>
  );
}
