import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/app/lib/firebase-admin";
import { GAME_FORMULAS, getPuzzleDifficulty } from "@/app/lib/scoring/formulas";
import type { GameId } from "@/app/lib/scoring/types";

/** POST /api/scores/session
 *
 * Called when a signed-in user starts a puzzle. Returns a one-time session
 * token that must be included in the subsequent score submission. The server
 * records gameId, puzzleId, and difficulty (looked up from the JSON file) so
 * neither can be tampered with client-side.
 *
 * Sessions expire after 4 hours and can only be consumed once.
 */
export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ saved: false }, { status: 401 });
  }
  let uid: string;
  let displayName: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    uid = decoded.uid;
    displayName = decoded.name ?? decoded.email ?? "Anonymous";
  } catch {
    return Response.json({ saved: false }, { status: 401 });
  }

  // ── Validate body ────────────────────────────────────────────────────────────
  const body = await request.json().catch(() => null) as { gameId?: unknown; puzzleId?: unknown } | null;
  if (!body || typeof body.gameId !== "string" || typeof body.puzzleId !== "number") {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  const gameId = body.gameId as GameId;
  const puzzleId = body.puzzleId;

  if (!GAME_FORMULAS[gameId]) {
    return Response.json({ error: "unknown_game" }, { status: 400 });
  }

  // ── Look up difficulty server-side ──────────────────────────────────────────
  const difficulty = await getPuzzleDifficulty(gameId, puzzleId);
  if (!difficulty) {
    return Response.json({ error: "unknown_puzzle" }, { status: 400 });
  }

  // ── Create session doc ──────────────────────────────────────────────────────
  const sessionId = randomUUID();
  const now = Date.now();
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

  return Response.json({ sessionId });
}
