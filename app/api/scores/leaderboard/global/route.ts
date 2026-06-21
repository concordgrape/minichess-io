import { NextRequest } from "next/server";
import { getAdminDb } from "@/app/lib/firebase-admin";

/** GET /api/scores/leaderboard/global?limit=25
 *
 * Returns top players ranked by globalScore.
 * globalScore = sum of each user's best normalizedScore per game (0–1000 per game).
 * Max possible = 12 games × 1000 = 12 000.
 */
export async function GET(request: NextRequest) {
  const limit = Math.min(100, Math.max(1, parseInt(
    request.nextUrl.searchParams.get("limit") ?? "25", 10
  )));

  const snap = await getAdminDb()
    .collection("users")
    .where("globalScore", ">", 0)
    .orderBy("globalScore", "desc")
    .limit(limit)
    .get();

  const entries = snap.docs.map((d, i) => ({
    rank: i + 1,
    uid: d.id,
    displayName: d.data().displayName ?? "Unknown",
    globalScore: d.data().globalScore ?? 0,
    gamesPlayed: Object.keys(d.data().gamesBest ?? {}).length,
  }));

  return Response.json({ entries });
}
