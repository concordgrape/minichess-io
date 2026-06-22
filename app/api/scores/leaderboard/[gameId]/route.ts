import { NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/app/lib/firebase-admin";
import { GAME_FORMULAS } from "@/app/lib/scoring/formulas";
import type { GameId } from "@/app/lib/scoring/types";

export const revalidate = 3600;

/** GET /api/scores/leaderboard/:gameId?limit=10
 *
 * Reads games/{gameId}/leaderboard/top-players and returns up to `limit` entries.
 * The document is a pre-sorted array maintained by the submit route, so no
 * Firestore query/index is needed — just one document read.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") ?? "10", 10)));

  if (!GAME_FORMULAS[gameId as GameId]) {
    return Response.json({ error: "unknown_game" }, { status: 404 });
  }

  const db = getAdminDb();

  const fetchTopPlayers = unstable_cache(
    async (gId: string, lim: number) => {
      try {
        const snap = await db
          .collection("games").doc(gId)
          .collection("leaderboard").doc("top-players")
          .get();
        const players = (snap.data()?.players ?? []) as Array<{
          rank: number; uid: string; displayName: string;
          score: number; normalizedScore: number; difficulty: string;
          updatedAt: string;
        }>;
        return players.slice(0, lim);
      } catch {
        return [];
      }
    },
    [`lb-${gameId}-${limit}`],
    { revalidate: 3600, tags: [`lb-${gameId}`] }
  );

  const entries = await fetchTopPlayers(gameId, limit);
  return Response.json({ gameId, entries });
}
