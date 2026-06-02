import { readFile } from "fs/promises";
import path from "path";
import SolitaireGame from "./SolitaireGame";
import type { PuzzleDef } from "./types";

export const metadata = { title: "MiniChess.io — Chess Solitaire" };

export default async function ChessSolitairePage() {
  const file = await readFile(
    path.join(process.cwd(), "public", "chess-solitaire-puzzles.json"),
    "utf-8"
  );
  const puzzles: PuzzleDef[] = JSON.parse(file);

  // Today's key in YYYY-MM-DD — used to identify the daily puzzle
  const todayKey = new Date().toISOString().split("T")[0];

  return <SolitaireGame puzzles={puzzles} todayKey={todayKey} />;
}
