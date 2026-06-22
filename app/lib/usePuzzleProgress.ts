"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../AuthProvider";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

interface ProgressData {
  completed: number[];
  inProgress: number[];
}

const EMPTY: ProgressData = { completed: [], inProgress: [] };

function storageKey(gameId: string) { return `progress_${gameId}`; }

function readLocal(gameId: string): ProgressData {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(storageKey(gameId));
    if (!raw) return EMPTY;
    return JSON.parse(raw) as ProgressData;
  } catch { return EMPTY; }
}

function writeLocal(gameId: string, data: ProgressData) {
  try { localStorage.setItem(storageKey(gameId), JSON.stringify(data)); } catch {}
}

async function pushToFirestore(gameId: string, completed: number[], uid: string) {
  if (!db) return;
  try {
    await setDoc(
      doc(db, "users", uid),
      { puzzleProgress: { [gameId]: { completed, updatedAt: new Date().toISOString() } } },
      { merge: true }
    );
  } catch (e) {
    console.warn("[progress] Firestore sync failed:", e);
  }
}

export function usePuzzleProgress(gameId: string) {
  const { user } = useAuth();
  const [data, setData] = useState<ProgressData>(EMPTY);
  const uid = user?.uid;

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setData(readLocal(gameId));
  }, [gameId]);

  // Debounce Firestore sync so rapid moves don't spam writes
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function scheduleSync(completed: number[]) {
    if (!uid) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => pushToFirestore(gameId, completed, uid), 2000);
  }

  const markInProgress = useCallback((puzzleId: number) => {
    setData(prev => {
      if (prev.completed.includes(puzzleId) || prev.inProgress.includes(puzzleId)) return prev;
      const next = { ...prev, inProgress: [...prev.inProgress, puzzleId] };
      writeLocal(gameId, next);
      return next;
    });
  }, [gameId]);

  const markCompleted = useCallback((puzzleId: number) => {
    setData(prev => {
      if (prev.completed.includes(puzzleId)) return prev;
      const next = {
        completed: [...prev.completed, puzzleId],
        inProgress: prev.inProgress.filter(id => id !== puzzleId),
      };
      writeLocal(gameId, next);
      scheduleSync(next.completed);
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, uid]);

  const getStatus = useCallback((puzzleId: number): "completed" | "inProgress" | null => {
    if (data.completed.includes(puzzleId)) return "completed";
    if (data.inProgress.includes(puzzleId)) return "inProgress";
    return null;
  }, [data]);

  return { markInProgress, markCompleted, getStatus };
}
