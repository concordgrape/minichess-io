import { readFile } from "fs/promises";
import path from "path";
import MiniChessGame from "./MiniChessGame";
import type { DailyPosition } from "./types";
import GameSeo from "@/app/components/GameSeo";

export const metadata = {
  title: "Mini Chess | 5x5 Chess Puzzle Game",
  description: "Play mini chess on a 5x5 board. A compact, fast-paced version of chess that sharpens your tactics. Free daily puzzle online.",
  keywords: ["mini chess", "5x5 chess", "small chess board", "chess variant", "chess puzzle game"],
  openGraph: {
    title: "Mini Chess | 5x5 Chess Puzzle Game | Chess Puzzles",
    description: "Play mini chess on a 5x5 board. A compact, fast-paced version of chess that sharpens your tactics.",
    url: "https://dailycheckmate.com/minichess",
  },
};

export default async function MiniChessPage() {
  const file = await readFile(
    path.join(process.cwd(), "public", "games", "minichess.json"),
    "utf-8"
  );
  const position: DailyPosition = JSON.parse(file);
  return (
    <div>
      <h1 className="h4 mb-1">Mini Chess</h1>
      <p className="text-muted mb-4">Play the daily 5×5 mini chess position against the engine.</p>
      <MiniChessGame position={position} />
      <GameSeo
        name="Mini Chess"
        description="Play mini chess on a 5x5 board. A compact, fast-paced version of chess that sharpens your tactics."
        url="https://dailycheckmate.com/minichess"
        guide={{ href: "/blog/mini-chess-strategy", title: "How to Win at Mini Chess" }}
      />
    </div>
  );
}
