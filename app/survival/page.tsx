import SurvivalGame from "./SurvivalGame";
// import GameLeaderboard from "@/app/components/GameLeaderboard";
import GameStartOverlay from "@/app/components/GameStartOverlay";

export const metadata = { title: "DailyCheckmate — Survival" };

export default function SurvivalPage() {
  return (
    <div>
      <h1 className="h4 mb-1">Survival</h1>
      <p className="text-muted mb-4">Capture pawns with your knight for as long as you can.</p>
      <GameStartOverlay gameId="survival">
        <SurvivalGame />
{/*         <GameLeaderboard gameId="survival" />*/}
      </GameStartOverlay>
    </div>
  );
}
