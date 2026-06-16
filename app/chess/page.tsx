import ChessBoard from "./ChessBoard";

export const metadata = { title: "MiniChess.io — Play Chess" };

export default function ChessPage() {
  return (
    <div>
      <h1 className="h4 mb-1">Play Chess</h1>
      <p className="text-muted mb-4">Play a full game against the engine — choose your difficulty.</p>
      <ChessBoard />
    </div>
  );
}
