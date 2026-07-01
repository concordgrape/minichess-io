"use client";

import { useState, useCallback, useRef } from "react";
import { GameStartContext } from "../lib/GameStartContext";
import type { GameId } from "../lib/scoring/types";

/** Context provider only | renders no UI. Wrap the whole game section in pages. */
export default function GameStartOverlay({
  gameId,
  children,
}: {
  gameId: GameId;
  children: React.ReactNode;
}) {
  const [phase, setPhase] = useState<"waiting" | "playing" | "complete">("waiting");
  const [startedAt, setStartedAt] = useState(0);
  const [leaderboard, setLeaderboard] = useState<import("../lib/scoring/types").LeaderboardEntry[] | null>(null);
  const [loadingLb, setLoadingLb] = useState(false);

  const markComplete = useCallback(() => {
    setPhase("complete");
    setLoadingLb(true);
    setTimeout(() => {
      fetch(`/api/scores/leaderboard/${gameId}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => { setLeaderboard(data.entries ?? []); setLoadingLb(false); })
        .catch(() => { setLeaderboard([]); setLoadingLb(false); });
    }, 2000);
  }, [gameId]);

  const resetGame = useCallback(() => {
    setPhase("waiting");
    setStartedAt(0);
    setLeaderboard(null);
  }, []);

  const handleStart = useCallback((cb: () => void) => {
    setStartedAt(Date.now());
    setPhase("playing");
    cb();
  }, []);

  return (
    <GameStartContext.Provider
      value={{ startedAt, phase, markComplete, resetGame, leaderboard, loadingLb, handleStart }}
    >
      {children}
    </GameStartContext.Provider>
  );
}
