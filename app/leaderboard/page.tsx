import { getAllLeaderboards } from "../lib/leaderboardData";
import LeaderboardClient from "./LeaderboardClient";

export const revalidate = 3600;

export const metadata = {
  title: "Leaderboard",
  description: "Top 10 players for each chess puzzle game on Chess Puzzles.",
};

export default async function LeaderboardPage() {
  const boards = await getAllLeaderboards();

  return (
    <div>
      <h1 className="h4 mb-1">Leaderboard</h1>
      <p className="text-muted mb-4">Top 10 players per puzzle game, updated every hour.</p>
      <LeaderboardClient boards={boards} />
    </div>
  );
}
