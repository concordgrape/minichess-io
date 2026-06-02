import { readFile } from "fs/promises";
import path from "path";
import SolitaireGame from "./SolitaireGame";
import type { Puzzle } from "./types";

export const metadata = { title: "MiniChess.io — Chess Solitaire" };

export default async function SolitairePage() {
  const file = await readFile(
    path.join(process.cwd(), "public", "solitaire-puzzles.json"),
    "utf-8"
  );
  const puzzles: Puzzle[] = JSON.parse(file);
  return <SolitaireGame puzzles={puzzles} />;
}
