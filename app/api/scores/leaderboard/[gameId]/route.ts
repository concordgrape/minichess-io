import { NextRequest } from "next/server";
import { getAdminDb } from "@/app/lib/firebase-admin";
import { GAME_FORMULAS } from "@/app/lib/scoring/formulas";
import type { GameId } from "@/app/lib/scoring/types";

export const dynamic = "force-dynamic";

/** GET /api/scores/leaderboard/:gameId?limit=10
 *
 * Reads games/{gameId}/leaderboard/top-players directly from Firestore.
 * Called client-side once after game completion — no cache layer needed here.
 * The server-side leaderboard page (leaderboardData.ts) handles its own caching.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") ?? "10", 10)));

    if (!GAME_FORMULAS[gameId as GameId]) {
      return Response.json({ error: "unknown_game" }, { status: 404 });
    }

    const snap = await getAdminDb()
      .collection("games").doc(gameId)
      .collection("leaderboard").doc("top-players")
      .get();

    const players = (snap.data()?.players ?? []) as Array<{
      rank: number; uid: string; displayName: string;
      score: number; normalizedScore: number; difficulty: string;
      updatedAt: string;
    }>;

    return Response.json({ gameId, entries: players.slice(0, limit) });
  } catch (e) {
    console.error("[leaderboard] error:", e);
    return Response.json(
      { error: "internal", detail: process.env.NODE_ENV === "development" ? String(e) : undefined },
      { status: 500 }
    );
  }
}
