import { NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminAuth, getAdminDb } from "@/app/lib/firebase-admin";
import type { LeaderboardEntry } from "@/app/lib/scoring/types";

interface PuzzleLeaderboardEntry extends LeaderboardEntry {
  score: number;
}

interface LeaderboardResponse {
  players: PuzzleLeaderboardEntry[];
  totalPlayers: number;
  userEntry: (PuzzleLeaderboardEntry & { rank: number }) | null;
}

function fetchPuzzleLeaderboard(gameId: string, puzzleId: string) {
  return unstable_cache(
    async () => {
      try {
        const snap = await getAdminDb()
          .collection("games").doc(gameId)
          .collection("puzzles").doc(puzzleId)
          .collection("leaderboard").doc("top-players")
          .get();
        const data = snap.data();
        return {
          players: (data?.players ?? []) as PuzzleLeaderboardEntry[],
          totalPlayers: (data?.totalPlayers ?? 0) as number,
        };
      } catch {
        return { players: [], totalPlayers: 0 };
      }
    },
    [`puzzle-lb-${gameId}-${puzzleId}`],
    { revalidate: 3600, tags: [`puzzle-lb-${gameId}-${puzzleId}`] }
  )();
}

async function fetchUserPuzzleScore(
  gameId: string,
  puzzleId: string,
  uid: string,
): Promise<{ score: number; normalizedScore: number; rank: number } | null> {
  try {
    const db = getAdminDb();
    const scoreSnap = await db
      .collection("games").doc(gameId)
      .collection("puzzles").doc(puzzleId)
      .collection("scores").doc(uid)
      .get();
    if (!scoreSnap.exists) return null;
    const d = scoreSnap.data()!;

    // Count players with a higher raw score to determine rank
    const { AggregateField } = await import("firebase-admin/firestore");
    const higherSnap = await db
      .collection("games").doc(gameId)
      .collection("puzzles").doc(puzzleId)
      .collection("scores")
      .where("score", ">", d.score as number)
      .count()
      .get();
    const rank = (higherSnap.data().count ?? 0) + 1;
    return { score: d.score as number, normalizedScore: d.normalizedScore as number, rank };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("game");
  const puzzleId = searchParams.get("puzzle");

  if (!gameId || !puzzleId) {
    return Response.json({ error: "missing_params" }, { status: 400 });
  }

  // Auth — required to personalise the "you" row
  const authHeader = request.headers.get("Authorization");
  let uid: string | null = null;
  let displayName: string | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const decoded = await (await getAdminAuth()).verifyIdToken(authHeader.slice(7));
      uid = decoded.uid;
      displayName = decoded.name ?? decoded.email ?? null;
    } catch {
      // Invalid token — treat as unauthenticated
    }
  }

  const { players, totalPlayers } = await fetchPuzzleLeaderboard(gameId, puzzleId);

  let userEntry: LeaderboardResponse["userEntry"] = null;
  if (uid) {
    const inTop = players.find((p) => p.uid === uid);
    if (inTop) {
      userEntry = { ...inTop, displayName: displayName ?? inTop.displayName };
    } else {
      // User not in top 100 — fetch their score and compute rank
      const puzzleScore = await fetchUserPuzzleScore(gameId, puzzleId, uid);
      if (puzzleScore) {
        userEntry = {
          rank: puzzleScore.rank,
          uid,
          displayName: displayName ?? "You",
          score: puzzleScore.score,
          normalizedScore: puzzleScore.normalizedScore,
          difficulty: "easy", // placeholder; not displayed in this context
          updatedAt: "",
        };
      }
    }
  }

  const response: LeaderboardResponse = { players, totalPlayers, userEntry };
  return Response.json(response, {
    headers: { "Cache-Control": "no-store" }, // cache is handled server-side
  });
}
