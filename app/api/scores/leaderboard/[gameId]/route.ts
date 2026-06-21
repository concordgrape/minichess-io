import { NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/app/lib/firebase-admin";
import { GAME_FORMULAS } from "@/app/lib/scoring/formulas";
import type { GameId, Difficulty } from "@/app/lib/scoring/types";

export const revalidate = 3600; // cache responses for 1 hour

/** GET /api/scores/leaderboard/:gameId?difficulty=easy&limit=25
 *
 * Returns top scores for a specific game.
 * - Without ?difficulty: top normalizedScores across all difficulties (bestScores collection)
 * - With ?difficulty: top raw scores for that specific difficulty (bestScoresByDiff collection)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const url = request.nextUrl;
  const difficulty = url.searchParams.get("difficulty") as Difficulty | null;
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "25", 10)));

  if (!GAME_FORMULAS[gameId as GameId]) {
    return Response.json({ error: "unknown_game" }, { status: 404 });
  }

  const db = getAdminDb();

  const fetchByDiff = unstable_cache(
    async (gId: string, diff: string, lim: number) => {
      const snap = await db
        .collection("bestScoresByDiff")
        .where("gameId", "==", gId)
        .where("difficulty", "==", diff)
        .orderBy("score", "desc")
        .limit(lim)
        .get();
      return snap.docs.map((d, i) => ({
        rank: i + 1, uid: d.data().uid as string,
        displayName: d.data().displayName as string,
        score: d.data().score as number,
        normalizedScore: d.data().normalizedScore as number,
        difficulty: d.data().difficulty as string,
        updatedAt: (d.data().updatedAt?.toDate?.()?.toISOString() as string) ?? null,
      }));
    },
    [`lb-diff-${gameId}-${difficulty}-${limit}`],
    { revalidate: 3600 }
  );

  const fetchAll = unstable_cache(
    async (gId: string, lim: number) => {
      const snap = await db
        .collection("bestScores")
        .where("gameId", "==", gId)
        .orderBy("normalizedScore", "desc")
        .limit(lim)
        .get();
      return snap.docs.map((d, i) => ({
        rank: i + 1, uid: d.data().uid as string,
        displayName: d.data().displayName as string,
        score: d.data().score as number,
        normalizedScore: d.data().normalizedScore as number,
        difficulty: d.data().difficulty as string,
        updatedAt: (d.data().updatedAt?.toDate?.()?.toISOString() as string) ?? null,
      }));
    },
    [`lb-all-${gameId}-${limit}`],
    { revalidate: 3600 }
  );

  if (difficulty) {
    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return Response.json({ error: "invalid_difficulty" }, { status: 400 });
    }
    const entries = await fetchByDiff(gameId, difficulty, limit);
    return Response.json({ gameId, difficulty, entries });
  }

  const entries = await fetchAll(gameId, limit);
  return Response.json({ gameId, entries });
}
