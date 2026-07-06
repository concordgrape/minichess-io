"use client";

import { useCallback } from "react";
import { useAuth } from "../AuthProvider";
import type { GameId, PuzzleRawData } from "./scoring/types";

const DEV = process.env.NODE_ENV === "development";

export function useGameSession(gameId: GameId, puzzleId: number) {
  const { user } = useAuth();

  const submitScore = useCallback(
    async (rawData: PuzzleRawData): Promise<{ rank: number | null }> => {
      if (!user || user.isAnonymous) {
        if (DEV) console.warn(`[score] skipped — not signed in (user=${user ? "anonymous" : "null"})`);
        return { rank: null };
      }
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/scores/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ gameId, puzzleId, rawData }),
        });
        const body = await res.json().catch(() => ({}));
        if (DEV) {
          if (res.ok && body.saved) {
            console.log(`[score] ✓ saved ${gameId} puzzle ${puzzleId} — score=${body.score} norm=${body.normalizedScore} rank=${body.rank}`);
          } else {
            console.error(`[score] ✗ failed ${res.status}:`, body);
          }
        }
        return { rank: typeof body.rank === "number" ? body.rank : null };
      } catch (e) {
        if (DEV) console.error(`[score] fetch threw:`, e);
        return { rank: null };
      }
    },
    [user, gameId, puzzleId]
  );

  return { submitScore };
}
