"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../AuthProvider";
import type { GameId, PuzzleRawData } from "./scoring/types";

const DEV = process.env.NODE_ENV === "development";

export function useGameSession(gameId: GameId, puzzleId: number) {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const activeKey = useRef<string>("");
  // Store rawData submitted while session was still loading so we can retry
  const pendingRef = useRef<PuzzleRawData | null>(null);

  useEffect(() => {
    if (!user || user.isAnonymous) {
      if (DEV) console.warn(`[GameSession] ${gameId}:${puzzleId} — skipping (user=${user ? "anonymous" : "null"})`);
      setSessionId(null);
      return;
    }

    const key = `${gameId}:${puzzleId}`;
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
        if (cancelled) return;
        if (res.ok) {
          const data: { sessionId: string } = await res.json();
          if (DEV) console.log(`[GameSession] ${gameId}:${puzzleId} — session ready: ${data.sessionId.slice(0, 8)}…`);
          setSessionId(data.sessionId);
        } else {
          const err = await res.json().catch(() => ({}));
          if (DEV) console.error(`[GameSession] session creation failed ${res.status}:`, err);
        }
      } catch (e) {
        if (DEV) console.error(`[GameSession] session fetch threw:`, e);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, gameId, puzzleId]);

  // When sessionId arrives and there's a pending submission, flush it
  useEffect(() => {
    if (!sessionId || !pendingRef.current || !user || user.isAnonymous) return;
    const rawData = pendingRef.current;
    pendingRef.current = null;
    if (DEV) console.log(`[GameSession] flushing pending submission for ${gameId}:${puzzleId}`);
    void doSubmit(user, sessionId, rawData, gameId, puzzleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const submitScore = useCallback(
    async (rawData: PuzzleRawData) => {
      if (!user || user.isAnonymous) {
        if (DEV) console.warn(`[GameSession] submitScore skipped — not signed in`);
        return;
      }
      if (!sessionId) {
        if (DEV) console.warn(`[GameSession] submitScore called before session ready — queuing for retry`);
        pendingRef.current = rawData;
        return;
      }
      await doSubmit(user, sessionId, rawData, gameId, puzzleId);
    },
    [user, sessionId, gameId, puzzleId]
  );

  return { submitScore };
}

async function doSubmit(
  user: import("firebase/auth").User,
  sessionId: string,
  rawData: PuzzleRawData,
  gameId: GameId,
  puzzleId: number
) {
  try {
    const token = await user.getIdToken();
    const res = await fetch("/api/scores/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sessionId, rawData }),
    });
    if (DEV) {
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.saved) {
        console.log(`[GameSession] ✓ score saved for ${gameId}:${puzzleId} — score=${body.score} norm=${body.normalizedScore}`);
      } else {
        console.error(`[GameSession] ✗ submit failed ${res.status}:`, body);
      }
    }
  } catch (e) {
    if (DEV) console.error(`[GameSession] submit threw:`, e);
  }
}
