import MateGame from "../mate/MateGame";
import type { MatePuzzle } from "../mate/types";

export const metadata = {
  title: "Rook Endgame Puzzle — MiniChess.io",
  description: "Solve a king and rook versus king endgame: cut off the king with the rook and checkmate. Free online chess endgame puzzle.",
};

const puzzles: MatePuzzle[] = [
  {
    id: "end-rook",
    title: "Rook Endgame",
    difficulty: "medium",
    fen: "7k/8/5K2/8/8/8/8/2R5 w - - 0 1",
    description: "King and rook versus king. Use the rook to cut off the back rank while your king takes the opposition.",
  },
];

export default function RookEndgamePage() {
  return (
    <div>
      <h1 className="h4 mb-1">Rook Endgame</h1>
      <p className="text-muted mb-4">Cut off the king with the rook and bring your king up to deliver mate.</p>
      <MateGame puzzles={puzzles} mateIn={2} />
    </div>
  );
}
