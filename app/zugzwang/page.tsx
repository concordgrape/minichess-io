import { readFile } from "fs/promises";
import path from "path";
import MateGame from "../mate/MateGame";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import HowToPlay from "@/app/components/HowToPlay";
import { getLocale } from "@/app/i18n";
import type { MatePuzzle } from "../mate/types";

export const metadata = {
  title: "Zugzwang Endgame Puzzle — DailyCheckmate",
  description: "Solve a zugzwang chess puzzle: find the quiet waiting move that leaves the opponent with no good reply, then checkmate. Free online endgame puzzle.",
};

export default async function ZugzwangPage() {
  const file = await readFile(path.join(process.cwd(), "public", "games", "zugzwang.json"), "utf-8");
  const t = await getLocale();
  const puzzle = JSON.parse(file);
  const { title, subtitle } = t.gamePages.zugzwang;
  return (
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      <GameStartOverlay gameId="zugzwang">
        <MateGame puzzle={puzzle} mateIn={2} slug="zugzwang" />
      </GameStartOverlay>
      <HowToPlay title={t.howToPlay.sectionTitle} steps={t.howToPlay.zugzwang} />
    </div>
  );
}
