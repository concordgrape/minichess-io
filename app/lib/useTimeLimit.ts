import { useEffect, useRef } from "react";

const THIRTY_MINUTES = 30 * 60 * 1000;

/**
 * Calls `onExpired` once when `limitMs` has elapsed since `startedAt`,
 * but only while `active` is true. Cancels automatically on cleanup.
 */
export function useTimeLimit(
  startedAt: number,
  active: boolean,
  onExpired: () => void,
  limitMs = THIRTY_MINUTES,
) {
  const cb = useRef(onExpired);
  cb.current = onExpired;

  useEffect(() => {
    if (!active || !startedAt) return;
    const remaining = limitMs - (Date.now() - startedAt);
    if (remaining <= 0) { cb.current(); return; }
    const id = setTimeout(() => cb.current(), remaining);
    return () => clearTimeout(id);
  }, [startedAt, active, limitMs]);
}
