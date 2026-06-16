import MateGame from "../mate/MateGame";
import type { MatePuzzle } from "../mate/types";

export const metadata = {
  title: "Zugzwang Endgame Puzzle — MiniChess.io",
  description: "Solve a zugzwang chess puzzle: find the quiet waiting move that leaves the opponent with no good reply, then checkmate. Free online endgame puzzle.",
};

const puzzles: MatePuzzle[] = [
  {
    id: "end-zugzwang",
    title: "Zugzwang",
    difficulty: "hard",
    fen: "7k/8/5K2/8/8/8/8/5Q2 w - - 0 1",
    description: "No check works yet. Make a quiet king move — Black is in zugzwang and must step into the mating net.",
  },
];

export default function ZugzwangPage() {
  return (
    <div>
      <h1 className="h4 mb-1">Zugzwang</h1>
      <p className="text-muted mb-4">Find the quiet waiting move that forces Black into a losing reply, then mate.</p>
      <MateGame puzzles={puzzles} mateIn={2} />
    </div>
  );
}
