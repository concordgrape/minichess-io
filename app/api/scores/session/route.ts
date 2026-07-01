import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { verifyFirebaseToken, getAdminDb } from "@/app/lib/firebase-admin";
import { GAME_FORMULAS, getPuzzleDifficulty } from "@/app/lib/scoring/formulas";
import type { GameId } from "@/app/lib/scoring/types";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "unauthenticated" }, { status: 401 });
    }

    let uid: string;
    let displayName: string;
    try {
      const decoded = await verifyFirebaseToken(authHeader.slice(7));
      uid = decoded.uid;
      displayName = decoded.name ?? decoded.email ?? `user_${uid.slice(0, 6)}`;
    } catch (e) {
      console.error("[session] token verify failed:", e);
      return Response.json({ error: "unauthenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => null) as { gameId?: unknown; puzzleId?: unknown } | null;
    if (!body || typeof body.gameId !== "string" || typeof body.puzzleId !== "number") {
      return Response.json({ error: "invalid_request" }, { status: 400 });
    }
    const gameId = body.gameId as GameId;
    const puzzleId = body.puzzleId as number;

    if (!GAME_FORMULAS[gameId]) {
      return Response.json({ error: "unknown_game" }, { status: 400 });
    }

    let difficulty: string | null;
    try {
      difficulty = await getPuzzleDifficulty(gameId, puzzleId);
    } catch (e) {
      console.error("[session] getPuzzleDifficulty threw:", e);
      return Response.json({ error: "puzzle_lookup_failed" }, { status: 500 });
    }
    if (!difficulty) {
      return Response.json({ error: "unknown_puzzle" }, { status: 400 });
    }

    const sessionId = randomUUID();
    const now = Date.now();
    try {
      await getAdminDb().collection("gameSessions").doc(sessionId).set({
        uid,
        displayName,
        gameId,
        puzzleId,
        difficulty,
        createdAt: new Date(now),
        expiresAt: new Date(now + 4 * 60 * 60 * 1000),
        usedAt: null,
      });
    } catch (e) {
      console.error("[session] Firestore write failed:", e);
      return Response.json({ error: "db_write_failed" }, { status: 500 });
    }

    return Response.json({ sessionId });
  } catch (e) {
    console.error("[session] unhandled error:", e);
    return Response.json({ error: "internal" }, { status: 500 });
  }
}
