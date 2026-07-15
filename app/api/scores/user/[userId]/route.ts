import { NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/app/lib/firebase-admin";
import type { UserScoresResponse } from "@/app/lib/scoring/types";

/**
 * Cached Firestore read, keyed per user.
 * - TTL 5 minutes (limits Firestore reads for repeat profile views)
 * - Tagged `user-scores-{uid}` — the score submit route busts this tag,
 *   so a fresh score appears immediately despite the cache.
 */
function fetchUserScores(userId: string) {
  return unstable_cache(
    async (): Promise<UserScoresResponse | null> => {
      const snap = await getAdminDb().collection("users").doc(userId).get();
      if (!snap.exists) return null;
      const data = snap.data()!;
      return {
        globalScore: data.globalScore ?? 0,
        gamesBest: data.gamesBest ?? {},
        difficultyCompletions: data.difficultyCompletions ?? {},
      };
    },
    ["user-scores", userId],
    { revalidate: 300, tags: [`user-scores-${userId}`] }
  )();
}

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
    const response = await fetchUserScores(userId);

    if (!response) {
      return Response.json({ error: "user_not_found" }, { status: 404 });
    }

    return Response.json(response);
  } catch (err) {
    console.error("[scores/user] error:", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
