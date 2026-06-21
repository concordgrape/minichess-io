"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../AuthProvider";
import type { GameId, PuzzleRawData } from "./scoring/types";

/**
 * Manages the server-side game session lifecycle for signed-in users.
 *
 * On mount (or when puzzleId changes), requests a one-time session token from
 * the server. On completion, `submitScore` sends raw game data (NOT a score)
 * for the server to recompute and store.
 *
 * Anonymous users silently skip session creation — the local saveScore()
 * call in each game component still runs as before.
 *
 * Usage:
 *   const { submitScore } = useGameSession("mate-in-2", puzzle.id);
 *   // on solve:
 *   submitScore({ timeSeconds, undoCount, totalAttempts });
 */
export function useGameSession(gameId: GameId, puzzleId: number) {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const activeKey = useRef<string>(""); // tracks "gameId:puzzleId" for the current session

  useEffect(() => {
    // Skip anonymous users and unauthenticated state
    if (!user || user.isAnonymous) { setSessionId(null); return; }

    const key = `${gameId}:${puzzleId}`;
    // Don't re-request a session if we already have one for this puzzle
    if (activeKey.current === key && sessionId) return;
    activeKey.current = key;
    setSessionId(null);

    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/scores/session", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ gameId, puzzleId }),
        });
        if (!cancelled && res.ok) {
          const data: { sessionId: string } = await res.json();
          setSessionId(data.sessionId);
        }
      } catch {
        // Network error — game continues normally, score just won't be saved
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, gameId, puzzleId]);

  const submitScore = useCallback(
    async (rawData: PuzzleRawData) => {
      if (!user || user.isAnonymous || !sessionId) return;
      try {
        const token = await user.getIdToken();
        await fetch("/api/scores/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ sessionId, rawData }),
        });
      } catch {
        // Silently ignore — the local score is already saved
      }
    },
    [user, sessionId]
  );

  return { submitScore };
}
