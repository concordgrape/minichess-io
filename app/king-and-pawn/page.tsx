import MateGame from "../mate/MateGame";
import type { MatePuzzle } from "../mate/types";

export const metadata = {
  title: "King and Pawn Endgame Puzzle — MiniChess.io",
  description: "Solve a king and pawn endgame: promote the pawn with the king's support and deliver checkmate. Free online chess endgame puzzle.",
};

const puzzles: MatePuzzle[] = [
  {
    id: "end-king-pawn",
    title: "King and Pawn",
    difficulty: "medium",
    fen: "8/5KPk/8/8/8/8/8/8 w - - 0 1",
    description: "The classic king-and-pawn endgame. Promote the pawn — your king guards the queening square — then mate.",
  },
];

export default function KingAndPawnPage() {
  return (
    <div>
      <h1 className="h4 mb-1">King and Pawn</h1>
      <p className="text-muted mb-4">Promote the pawn with your king&apos;s support, then deliver checkmate.</p>
      <MateGame puzzles={puzzles} mateIn={2} />
    </div>
  );
}
