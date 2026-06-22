"use client";
import { createContext, useContext } from "react";
import type { LeaderboardEntry } from "./scoring/types";

export interface GameStartContextValue {
  startedAt: number;
  phase: "waiting" | "playing" | "complete";
  markComplete: () => void;
  resetGame: () => void;
  leaderboard: LeaderboardEntry[] | null;
  loadingLb: boolean;
  handleStart: (cb: () => void) => void;
}

export const GameStartContext = createContext<GameStartContextValue>({
  startedAt: 0,
  phase: "waiting",
  markComplete: () => {},
  resetGame: () => {},
  leaderboard: null,
  loadingLb: false,
  handleStart: (cb) => cb(),
});

export function useGamePhase() {
  return useContext(GameStartContext);
}
