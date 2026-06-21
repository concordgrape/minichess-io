import { NextRequest } from "next/server";
import { getAdminDb } from "@/app/lib/firebase-admin";
import { GAME_FORMULAS } from "@/app/lib/scoring/formulas";
import type { GameId, Difficulty } from "@/app/lib/scoring/types";

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

  if (difficulty) {
    // Per-difficulty leaderboard: top raw scores for this game+difficulty
    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return Response.json({ error: "invalid_difficulty" }, { status: 400 });
    }
    const snap = await db
      .collection("bestScoresByDiff")
      .where("gameId", "==", gameId)
      .where("difficulty", "==", difficulty)
      .orderBy("score", "desc")
      .limit(limit)
      .get();

    const entries = snap.docs.map((d, i) => ({
      rank: i + 1,
      uid: d.data().uid,
      displayName: d.data().displayName,
      score: d.data().score,
      normalizedScore: d.data().normalizedScore,
      difficulty: d.data().difficulty,
      updatedAt: d.data().updatedAt?.toDate?.()?.toISOString() ?? null,
    }));
    return Response.json({ gameId, difficulty, entries });
  }

  // Overall leaderboard: top normalizedScores across all difficulties
  const snap = await db
    .collection("bestScores")
    .where("gameId", "==", gameId)
    .orderBy("normalizedScore", "desc")
    .limit(limit)
    .get();

  const entries = snap.docs.map((d, i) => ({
    rank: i + 1,
    uid: d.data().uid,
    displayName: d.data().displayName,
    score: d.data().score,
    normalizedScore: d.data().normalizedScore,
    difficulty: d.data().difficulty,
    updatedAt: d.data().updatedAt?.toDate?.()?.toISOString() ?? null,
  }));
  return Response.json({ gameId, entries });
}
