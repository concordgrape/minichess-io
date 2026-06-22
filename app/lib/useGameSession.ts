"use client";

import { useCallback } from "react";
import { useAuth } from "../AuthProvider";
import type { GameId, PuzzleRawData } from "./scoring/types";

const DEV = process.env.NODE_ENV === "development";

export function useGameSession(gameId: GameId, puzzleId: number) {
  const { user } = useAuth();

  const submitScore = useCallback(
    async (rawData: PuzzleRawData) => {
      if (!user || user.isAnonymous) {
        if (DEV) console.warn(`[score] skipped — not signed in (user=${user ? "anonymous" : "null"})`);
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/scores/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ gameId, puzzleId, rawData }),
        });
        if (DEV) {
          const body = await res.clone().json().catch(() => ({}));
          if (res.ok && body.saved) {
            console.log(`[score] ✓ saved ${gameId} puzzle ${puzzleId} — score=${body.score} norm=${body.normalizedScore}`);
          } else {
            console.error(`[score] ✗ failed ${res.status}:`, body);
          }
        }
      } catch (e) {
        if (DEV) console.error(`[score] fetch threw:`, e);
      }
    },
    [user, gameId, puzzleId]
  );

  return { submitScore };
}
