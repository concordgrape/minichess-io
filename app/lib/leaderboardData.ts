import { unstable_cache } from "next/cache";
import { getAdminDb } from "./firebase-admin";
import { GAME_FORMULAS } from "./scoring/formulas";
import type { GameId, LeaderboardEntry } from "./scoring/types";

export const GAME_IDS = Object.keys(GAME_FORMULAS) as GameId[];

export const GAME_LABELS: Record<GameId, string> = {
  "mate-in-1": "Mate in 1",
  "mate-in-2": "Mate in 2",
  "mate-in-3": "Mate in 3",
  "check": "Check",
  "smothered": "Smothered",
  "takes": "Takes",
  "solitaire": "Chain Capture",
  "chess-solitaire": "Chess Solitaire",
  "queen-vs-pawn": "Queen vs Pawn",
  "king-and-pawn": "King & Pawn",
  "rook-endgame": "Rook Endgame",
  "zugzwang": "Zugzwang",
};

export type GameLeaderboard = {
  gameId: GameId;
  label: string;
  entries: LeaderboardEntry[];
};

/** Fetch top-10 for a single game from games/{gameId}/leaderboard/top-players. */
const fetchGame = (gameId: GameId) =>
  unstable_cache(
    async () => {
      try {
        const snap = await getAdminDb()
          .collection("games").doc(gameId)
          .collection("leaderboard").doc("top-players")
          .get();
        return ((snap.data()?.players ?? []) as LeaderboardEntry[]).slice(0, 10);
      } catch {
        return [];
      }
    },
    [`page-lb-${gameId}`],
    { revalidate: 3600, tags: [`lb-${gameId}`] }
  )();

/** Fetch all 12 game leaderboards in parallel, each cached independently. */
export async function getAllLeaderboards(): Promise<GameLeaderboard[]> {
  const results = await Promise.all(
    GAME_IDS.map(async (gameId) => ({
      gameId,
      label: GAME_LABELS[gameId],
      entries: await fetchGame(gameId),
    }))
  );
  return results;
}
