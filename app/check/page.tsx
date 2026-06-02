import { readFile } from "fs/promises";
import path from "path";
import CheckGame from "./CheckGame";
import type { Puzzle } from "./types";

export const metadata = { title: "MiniChess.io — Check" };

export default async function CheckPage() {
  const file = await readFile(
    path.join(process.cwd(), "public", "check-puzzles.json"),
    "utf-8"
  );
  const puzzles: Puzzle[] = JSON.parse(file);
  return <CheckGame puzzles={puzzles} />;
}
