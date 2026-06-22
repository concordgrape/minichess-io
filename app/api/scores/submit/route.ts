import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { revalidateTag } from "next/cache";
import { getAdminAuth, getAdminDb } from "@/app/lib/firebase-admin";
import { GAME_FORMULAS, computeScore } from "@/app/lib/scoring/formulas";
import type { GameId, Difficulty, PuzzleRawData } from "@/app/lib/scoring/types";

const RATE_LIMIT = 20; // max submissions per user per hour

/** POST /api/scores/submit
 *
 * Accepts raw game data (NOT a score). The server:
 *   1. Verifies the Firebase Auth token
 *   2. Validates and consumes the one-time session token
 *   3. Rate-limits (20/hour per user)
 *   4. Validates plausibility of raw data against game bounds
 *   5. Recomputes score using server-side formula + server-stored difficulty
 *   6. Updates bestScores, bestScoresByDiff, user gamesBest, globalScore
 *   7. Appends to user's gameHistory
 *   8. Runs Welford anomaly detection; flags outliers (z > 3, n > 10)
 */
export async function POST(request: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ saved: false, reason: "unauthenticated" }, { status: 401 });
  }
  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    uid = decoded.uid;
  } catch {
    return Response.json({ saved: false, reason: "unauthenticated" }, { status: 401 });
  }

  // ── Parse body ───────────────────────────────────────────────────────────────
  const body = await request.json().catch(() => null) as {
    sessionId?: unknown;
    rawData?: unknown;
  } | null;
  if (
    !body ||
    typeof body.sessionId !== "string" ||
    !body.rawData ||
    typeof body.rawData !== "object"
  ) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  const raw = body.rawData as Record<string, unknown>;
  if (
    typeof raw.timeSeconds !== "number" ||
    typeof raw.undoCount !== "number" ||
    typeof raw.totalAttempts !== "number"
  ) {
    return Response.json({ error: "invalid_raw_data" }, { status: 400 });
  }
  const rawData: PuzzleRawData = {
    timeSeconds: raw.timeSeconds,
    undoCount: Math.max(0, Math.round(raw.undoCount)),
    totalAttempts: Math.max(1, Math.round(raw.totalAttempts)),
  };

  const db = getAdminDb();
  const sessionRef = db.collection("gameSessions").doc(body.sessionId as string);
  const rateLimitRef = db.collection("rateLimits").doc(uid);
  const now = Date.now();

  // ── Consume session + rate-limit (transaction) ────────────────────────────────
  let gameId!: GameId;
  let puzzleId!: number;
  let difficulty!: Difficulty;
  let displayName!: string;

  try {
    await db.runTransaction(async (tx) => {
      const [sessionSnap, rlSnap] = await Promise.all([
        tx.get(sessionRef),
        tx.get(rateLimitRef),
      ]);

      // Session checks
      if (!sessionSnap.exists) throw new Error("session_not_found");
      const session = sessionSnap.data()!;
      if (session.uid !== uid) throw new Error("session_uid_mismatch");
      if (session.usedAt !== null) throw new Error("session_already_used");
      if (session.expiresAt.toMillis() < now) throw new Error("session_expired");

      // Rate-limit check
      const rl = rlSnap.data();
      const windowStart: number = rl?.windowStart?.toMillis() ?? 0;
      const inWindow = now - windowStart < 60 * 60 * 1000;
      const count: number = inWindow ? (rl?.count ?? 0) : 0;
      if (count >= RATE_LIMIT) throw new Error("rate_limited");

      // Mark session used
      tx.update(sessionRef, { usedAt: new Date(now) });

      // Update rate-limit window
      tx.set(rateLimitRef, {
        count: inWindow ? FieldValue.increment(1) : 1,
        windowStart: inWindow ? rl!.windowStart : new Date(now),
      }, { merge: true });

      gameId = session.gameId as GameId;
      puzzleId = session.puzzleId as number;
      difficulty = session.difficulty as Difficulty;
      displayName = session.displayName as string;
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown";
    if (msg === "rate_limited") return Response.json({ saved: false, reason: "rate_limited" }, { status: 429 });
    if (msg === "session_already_used") return Response.json({ saved: false, reason: "already_submitted" }, { status: 409 });
    if (process.env.NODE_ENV === "development") console.error("session tx error:", msg);
    return Response.json({ saved: false, reason: "invalid_session" }, { status: 400 });
  }

  // ── Plausibility check ───────────────────────────────────────────────────────
  const formula = GAME_FORMULAS[gameId!];
  const [minT, maxT] = formula.timeBounds;
  if (rawData.timeSeconds < minT || rawData.timeSeconds > maxT) {
    return Response.json({ saved: false, reason: "implausible_time" }, { status: 422 });
  }

  // ── Compute score ────────────────────────────────────────────────────────────
  const { score, normalizedScore } = computeScore(rawData, gameId!, difficulty!);
  const completedAt = new Date(now);

  // ── Write to games/{gameId}/scores/{uid} and update top-players leaderboard ──
  const gameRef = db.collection("games").doc(gameId!);
  const userScoreRef = gameRef.collection("scores").doc(uid);
  const topPlayersRef = gameRef.collection("leaderboard").doc("top-players");
  const userRef = db.collection("users").doc(uid);

  await db.runTransaction(async (tx) => {
    const [userScoreSnap, topPlayersSnap, userSnap] = await Promise.all([
      tx.get(userScoreRef),
      tx.get(topPlayersRef),
      tx.get(userRef),
    ]);

    const prevScore = userScoreSnap.data();
    const isNewBest = !prevScore || normalizedScore > (prevScore.normalizedScore as number);

    // Write user's best score for this game
    if (isNewBest) {
      tx.set(userScoreRef, {
        uid, displayName: displayName!,
        gameId: gameId!, difficulty: difficulty!,
        puzzleId: puzzleId!,
        score, normalizedScore,
        updatedAt: completedAt,
      });
    }

    // Update top-100 leaderboard document for this game
    if (isNewBest) {
      type Player = {
        rank: number; uid: string; displayName: string;
        score: number; normalizedScore: number; difficulty: string;
        updatedAt: string;
      };
      const existing: Player[] = topPlayersSnap.data()?.players ?? [];

      // Remove previous entry for this user (if any), add updated entry, sort, cap at 100
      const without = existing.filter((p) => p.uid !== uid);
      without.push({
        rank: 0, uid, displayName: displayName!,
        score, normalizedScore, difficulty: difficulty!,
        updatedAt: completedAt.toISOString(),
      });
      without.sort((a, b) => b.normalizedScore - a.normalizedScore);
      const top100 = without.slice(0, 100).map((p, i) => ({ ...p, rank: i + 1 }));

      tx.set(topPlayersRef, { players: top100, updatedAt: completedAt });
    }

    // Update users/{uid} globalScore (used by profile page + global leaderboard)
    const userData = userSnap.data() ?? {};
    const gamesBest: Record<string, unknown> = userData.gamesBest ?? {};
    const currentGlobalScore: number = userData.globalScore ?? 0;
    const prevNorm: number = (gamesBest[gameId!] as { normalizedScore?: number } | undefined)?.normalizedScore ?? 0;

    if (isNewBest) {
      tx.set(userRef, {
        globalScore: Math.max(0, currentGlobalScore - prevNorm + normalizedScore),
        gamesBest: {
          ...gamesBest,
          [gameId!]: {
            score, normalizedScore, difficulty: difficulty!,
            puzzleId: puzzleId!, updatedAt: completedAt.toISOString(),
          },
        },
      }, { merge: true });
    }
  });

  // ── Append to history (outside transaction — append-only, no conflict risk) ──
  await db.collection("users").doc(uid).collection("gameHistory").add({
    gameId: gameId!, difficulty: difficulty!, puzzleId: puzzleId!,
    score, normalizedScore, rawData,
    completedAt,
  });

  // ── Anomaly detection (Welford online algorithm) ─────────────────────────────
  const statsKey = `${gameId}_${difficulty}`;
  const statsRef = db.collection("scoreStats").doc(statsKey);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(statsRef);
    const s = snap.data() ?? { count: 0, mean: 0, m2: 0 };
    const count: number = (s.count as number) + 1;
    const delta = score - (s.mean as number);
    const mean = (s.mean as number) + delta / count;
    const delta2 = score - mean;
    const m2 = (s.m2 as number) + delta * delta2;
    tx.set(statsRef, { count, mean, m2, updatedAt: new Date(now) });

    // Flag if z-score > 3 after at least 10 samples
    if (count > 10) {
      const variance = m2 / (count - 1);
      const stddev = Math.sqrt(variance);
      if (stddev > 0) {
        const zscore = (score - mean) / stddev;
        if (zscore > 3) {
          db.collection("flaggedScores").add({
            uid, displayName: displayName!,
            gameId: gameId!, difficulty: difficulty!, puzzleId: puzzleId!,
            score, normalizedScore, zscore,
            mean, stddev, rawData,
            completedAt,
            reviewed: false,
          });
        }
      }
    }
  });

  // Bust leaderboard caches for this game so the next fetch returns fresh data
  revalidateTag(`lb-${gameId}`, { expire: 0 });

  return Response.json({ saved: true, score, normalizedScore });
}
