import { readFile } from "fs/promises";
import path from "path";
import MiniChessGame from "./MiniChessGame";
import type { DailyPosition } from "./types";

export const metadata = { title: "MiniChess.io — Mini Chess" };

export default async function MiniChessPage() {
  const file = await readFile(
    path.join(process.cwd(), "public", "minichess-latest.json"),
    "utf-8"
  );
  const position: DailyPosition = JSON.parse(file);
  return <MiniChessGame position={position} />;
}
