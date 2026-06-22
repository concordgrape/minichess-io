import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { revalidateTag } from "next/cache";
import { getAdminAuth, getAdminDb } from "@/app/lib/firebase-admin";
import { GAME_FORMULAS, getPuzzleDifficulty, computeScore } from "@/app/lib/scoring/formulas";
import type { GameId, PuzzleRawData } from "@/app/lib/scoring/types";

const RATE_LIMIT = 20; // max submissions per user per hour

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ saved: false, reason: "unauthenticated" }, { status: 401 });
    }
    let uid: string;
    let displayName: string;
    try {
      const adminAuth = await getAdminAuth();
      const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
      uid = decoded.uid;
      displayName = decoded.name ?? decoded.email ?? `user_${decoded.uid.slice(0, 6)}`;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Distinguish a bad/expired token from an admin SDK init failure
      const isAuthError = msg.includes("Firebase ID token") || msg.includes("auth/") || msg.includes("invalid-argument");
      console.error("[submit] auth error:", msg);
      if (isAuthError) {
        return Response.json({ saved: false, reason: "unauthenticated" }, { status: 401 });
      }
      return Response.json({ saved: false, reason: "auth_init_failed", detail: msg }, { status: 500 });
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await request.json().catch(() => null) as {
      gameId?: unknown;
      puzzleId?: unknown;
      rawData?: unknown;
    } | null;
    if (
      !body ||
      typeof body.gameId !== "string" ||
      typeof body.puzzleId !== "number" ||
      !body.rawData ||
      typeof body.rawData !== "object"
    ) {
      return Response.json({ error: "invalid_request" }, { status: 400 });
    }
    const gameId = body.gameId as GameId;
    const puzzleId = body.puzzleId as number;

    if (!GAME_FORMULAS[gameId]) {
      return Response.json({ error: "unknown_game" }, { status: 400 });
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
      undoCount: Math.max(0, Math.round(raw.undoCount as number)),
      totalAttempts: Math.max(1, Math.round(raw.totalAttempts as number)),
    };

    // ── Plausibility check ────────────────────────────────────────────────────
    const formula = GAME_FORMULAS[gameId];
    const [minT, maxT] = formula.timeBounds;
    if (rawData.timeSeconds < minT || rawData.timeSeconds > maxT) {
      console.warn(`[submit] implausible time ${rawData.timeSeconds}s for ${gameId} (bounds: ${minT}–${maxT})`);
      return Response.json({ saved: false, reason: "implausible_time" }, { status: 422 });
    }

    // ── Look up puzzle difficulty from server-side JSON ───────────────────────
    let difficulty: string;
    try {
      const d = await getPuzzleDifficulty(gameId, puzzleId);
      if (!d) {
        console.warn(`[submit] puzzle not found: ${gameId} #${puzzleId}`);
        return Response.json({ error: "unknown_puzzle" }, { status: 400 });
      }
      difficulty = d;
    } catch (e) {
      console.error("[submit] getPuzzleDifficulty threw:", e);
      return Response.json({ error: "puzzle_lookup_failed" }, { status: 500 });
    }

    const db = getAdminDb();
    const now = Date.now();
    const completedAt = new Date(now);

    // ── Rate limit ────────────────────────────────────────────────────────────
    const rateLimitRef = db.collection("rateLimits").doc(uid);
    try {
      const rlSnap = await rateLimitRef.get();
      const rl = rlSnap.data();
      const windowStart: number = rl?.windowStart?.toMillis() ?? 0;
      const inWindow = now - windowStart < 60 * 60 * 1000;
      const count: number = inWindow ? (rl?.count ?? 0) : 0;
      if (count >= RATE_LIMIT) {
        return Response.json({ saved: false, reason: "rate_limited" }, { status: 429 });
      }
      await rateLimitRef.set(
        { count: inWindow ? FieldValue.increment(1) : 1, windowStart: inWindow ? rl!.windowStart : new Date(now) },
        { merge: true }
      );
    } catch (e) {
      console.error("[submit] rate limit check failed:", e);
      // Non-fatal — continue without rate limiting
    }

    // ── Compute score ─────────────────────────────────────────────────────────
    const { score, normalizedScore } = computeScore(rawData, gameId, difficulty as never);

    // ── Write to games/{gameId}/scores/{uid} + update top-players leaderboard ─
    const gameRef = db.collection("games").doc(gameId);
    const userScoreRef = gameRef.collection("scores").doc(uid);
    const topPlayersRef = gameRef.collection("leaderboard").doc("top-players");
    const userRef = db.collection("users").doc(uid);

    try {
      await db.runTransaction(async (tx) => {
        const [userScoreSnap, topPlayersSnap, userSnap] = await Promise.all([
          tx.get(userScoreRef),
          tx.get(topPlayersRef),
          tx.get(userRef),
        ]);

        const prevScore = userScoreSnap.data();
        const isNewBest = !prevScore || normalizedScore > (prevScore.normalizedScore as number);

        if (isNewBest) {
          tx.set(userScoreRef, {
            uid, displayName,
            gameId, difficulty,
            puzzleId,
            score, normalizedScore,
            updatedAt: completedAt,
          });

          type Player = {
            rank: number; uid: string; displayName: string;
            score: number; normalizedScore: number; difficulty: string;
            updatedAt: string;
          };
          const existing: Player[] = topPlayersSnap.data()?.players ?? [];
          const without = existing.filter((p) => p.uid !== uid);
          without.push({ rank: 0, uid, displayName, score, normalizedScore, difficulty, updatedAt: completedAt.toISOString() });
          without.sort((a, b) => b.normalizedScore - a.normalizedScore);
          const top100 = without.slice(0, 100).map((p, i) => ({ ...p, rank: i + 1 }));
          tx.set(topPlayersRef, { players: top100, updatedAt: completedAt });

          const userData = userSnap.data() ?? {};
          const gamesBest: Record<string, unknown> = userData.gamesBest ?? {};
          const currentGlobalScore: number = userData.globalScore ?? 0;
          const prevNorm: number = (gamesBest[gameId] as { normalizedScore?: number } | undefined)?.normalizedScore ?? 0;
          const diffComp = (userData.difficultyCompletions ?? {}) as Record<string, Record<string, number>>;
          const gameDiff = diffComp[gameId] ?? {};
          tx.set(userRef, {
            globalScore: Math.max(0, currentGlobalScore - prevNorm + normalizedScore),
            gamesBest: {
              ...gamesBest,
              [gameId]: { score, normalizedScore, difficulty, puzzleId, updatedAt: completedAt.toISOString() },
            },
            difficultyCompletions: {
              ...diffComp,
              [gameId]: { ...gameDiff, [difficulty]: (gameDiff[difficulty] ?? 0) + 1 },
            },
          }, { merge: true });
        }
      });
    } catch (e) {
      console.error("[submit] Firestore transaction failed:", e);
      return Response.json({ saved: false, reason: "db_error" }, { status: 500 });
    }

    // ── Append to history (non-critical) ──────────────────────────────────────
    db.collection("users").doc(uid).collection("gameHistory").add({
      gameId, difficulty, puzzleId,
      score, normalizedScore, rawData,
      completedAt,
    }).catch((e) => console.error("[submit] history write failed:", e));

    // ── Anomaly detection (Welford) ───────────────────────────────────────────
    const statsKey = `${gameId}_${difficulty}`;
    const statsRef = db.collection("scoreStats").doc(statsKey);
    db.runTransaction(async (tx) => {
      const snap = await tx.get(statsRef);
      const s = snap.data() ?? { count: 0, mean: 0, m2: 0 };
      const count: number = (s.count as number) + 1;
      const delta = score - (s.mean as number);
      const mean = (s.mean as number) + delta / count;
      const delta2 = score - mean;
      const m2 = (s.m2 as number) + delta * delta2;
      tx.set(statsRef, { count, mean, m2, updatedAt: new Date(now) });
      if (count > 10) {
        const variance = m2 / (count - 1);
        const stddev = Math.sqrt(variance);
        if (stddev > 0 && (score - mean) / stddev > 3) {
          db.collection("flaggedScores").add({ uid, displayName, gameId, difficulty, puzzleId, score, normalizedScore, zscore: (score - mean) / stddev, mean, stddev, rawData, completedAt, reviewed: false }).catch(() => {});
        }
      }
    }).catch(() => {});

    // ── Bust leaderboard cache ────────────────────────────────────────────────
    revalidateTag(`lb-${gameId}`, { expire: 0 });

    return Response.json({ saved: true, score, normalizedScore });
  } catch (e) {
    console.error("[submit] unhandled error:", e);
    return Response.json({ saved: false, reason: "internal" }, { status: 500 });
  }
}
