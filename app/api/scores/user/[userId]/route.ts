import { NextRequest } from "next/server";
import { getAdminDb } from "@/app/lib/firebase-admin";
import type { UserScoresResponse } from "@/app/lib/scoring/types";

/** GET /api/scores/user/:userId
 *
 * Returns a user's per-game best scores and global aggregate score.
 * Public endpoint — no auth required (all scores are public by design).
 * Returns 404 if the user has never submitted a score.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const snap = await getAdminDb().collection("users").doc(userId).get();

    if (!snap.exists) {
      return Response.json({ error: "user_not_found" }, { status: 404 });
    }

    const data = snap.data()!;
    const response: UserScoresResponse = {
      globalScore: data.globalScore ?? 0,
      gamesBest: data.gamesBest ?? {},
      difficultyCompletions: data.difficultyCompletions ?? {},
    };

    return Response.json(response);
  } catch (err) {
    console.error("[scores/user] error:", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
