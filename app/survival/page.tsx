import SurvivalGame from "./SurvivalGame";
// import GameLeaderboard from "@/app/components/GameLeaderboard";
import GameStartOverlay from "@/app/components/GameStartOverlay";
import GameSeo from "@/app/components/GameSeo";

export const metadata = {
  title: "Survival Chess | How Long Can You Last?",
  description: "Survive as long as possible against waves of chess pieces. A fast-paced chess endurance game. Free to play online.",
  keywords: ["survival chess", "chess survival game", "chess endurance", "free chess game online"],
  openGraph: {
    title: "Survival Chess | How Long Can You Last? | Chess Puzzles",
    description: "Survive as long as possible against waves of chess pieces. A fast-paced chess endurance game.",
    url: "https://dailycheckmate.com/survival",
  },
};

export default function SurvivalPage() {
  return (
    <div>
      <h1 className="h4 mb-1">Survival</h1>
      <p className="text-muted mb-4">Capture pawns with your knight for as long as you can.</p>
      <GameStartOverlay gameId="survival">
        <SurvivalGame />
{/*         <GameLeaderboard gameId="survival" />*/}
      </GameStartOverlay>
      <GameSeo
        name="Survival Chess"
        description="Survive as long as possible against waves of chess pieces. A fast-paced chess endurance game."
        url="https://dailycheckmate.com/survival"
      />
    </div>
  );
}
