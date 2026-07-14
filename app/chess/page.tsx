import ChessBoard from "./ChessBoard";

export const metadata = {
  title: "Play Chess Online Free",
  description: "Play chess online for free against a computer opponent. Choose your difficulty from beginner to advanced and improve your game.",
  keywords: ["play chess online", "chess vs computer", "free chess game", "chess online"],
  openGraph: {
    title: "Play Chess Online Free | Chess Puzzles",
    description: "Play chess online for free against a computer opponent. Choose your difficulty from beginner to advanced.",
    url: "https://dailycheckmate.com/chess",
  },
};

export default function ChessPage() {
  return (
    <div>
      <ChessBoard />
    </div>
  );
}
