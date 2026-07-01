import SmotheredGame from "./SmotheredGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import { getLocale } from "@/app/i18n";

export const metadata = {
  title: "Smothered Mate Puzzle | Daily Chess Tactics",
  description: "Deliver a smothered mate: use a knight to checkmate a king trapped by its own pieces. A classic daily chess tactic. Free to play.",
  keywords: ["smothered mate", "smothered mate puzzle", "knight checkmate", "chess tactics", "daily chess puzzle"],
  openGraph: {
    title: "Smothered Mate Puzzle | Daily Chess Tactics | Daily Checkmate",
    description: "Deliver a smothered mate: use a knight to checkmate a king trapped by its own pieces.",
    url: "https://dailycheckmate.com/smothered",
  },
};

export default async function SmotheredPage() {
  const t = await getLocale();
  const { title, subtitle } = t.gamePages.smothered;
  return (
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      <GameStartOverlay gameId="smothered">
        <SmotheredGame />
      </GameStartOverlay>
      <HowToPlay title={t.howToPlay.sectionTitle} steps={t.howToPlay.smothered} />
    </div>
  );
}
