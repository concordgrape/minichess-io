import { readFile } from "fs/promises";
import path from "path";
import MiniChessGame from "./MiniChessGame";
import type { DailyPosition } from "./types";

export const metadata = { title: "DailyCheckmate — Mini Chess" };

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
    </div>
  );
}
