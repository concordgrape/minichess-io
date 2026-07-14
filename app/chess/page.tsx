import ChessBoard from "./ChessBoard";
import GameSeo from "@/app/components/GameSeo";

export const metadata = {
  title: "Play Chess Online Free",
  description: "Play chess online for free against a computer opponent. Choose your difficulty from beginner to advanced and improve your game.",
  keywords: ["play chess online", "chess vs computer", "free chess game", "chess online"],
  openGraph: {
    title: "Play Chess Online Free | Chess Puzzles",
    description: "Play chess online for free against a computer opponent. Choose your difficulty from beginner to advanced.",
    url: "https://dailycheckmate.com/chess",
    images: [{ url: "/images/chess.png", alt: "Play Chess Online" }],
  },
};

export default function ChessPage() {
  return (
    <div>
      <ChessBoard />
      <GameSeo
        name="Play Chess Online"
        description="Play chess online for free against a computer opponent. Choose your difficulty from beginner to advanced."
        url="https://dailycheckmate.com/chess"
      />
    </div>
  );
}
