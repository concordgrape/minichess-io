import { readFile } from "fs/promises";
import path from "path";
import SmotheredGame from "./SmotheredGame";
import type { Puzzle } from "./types";

export const metadata = { title: "MiniChess.io — Smothered" };

export default async function SmotheredPage() {
  const file = await readFile(
    path.join(process.cwd(), "public", "smothered-puzzles.json"),
    "utf-8"
  );
  const puzzles: Puzzle[] = JSON.parse(file);
  return <SmotheredGame puzzles={puzzles} />;
}
