"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../AuthProvider";

interface LeaderboardEntry {
  rank: number;
  uid: string;
  displayName: string;
  score: number;
  normalizedScore: number;
  updatedAt: string;
}

interface LeaderboardResponse {
  players: LeaderboardEntry[];
  totalPlayers: number;
  userEntry: (LeaderboardEntry & { rank: number }) | null;
}

// Client-side cache: keyed by `${gameId}-${puzzleId}`
const cache = new Map<string, LeaderboardResponse>();

interface Props {
  gameId: string;
  puzzleId: number;
  onClose: () => void;
  /** Call this to invalidate the cache when the user submits a new score */
  invalidateRef?: React.MutableRefObject<(() => void) | null>;
}

export default function LeaderboardModal({ gameId, puzzleId, onClose, invalidateRef }: Props) {
  const { user } = useAuth();
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const cacheKey = `${gameId}-${puzzleId}`;

  // Expose cache invalidation to parent
  useEffect(() => {
    if (invalidateRef) {
      invalidateRef.current = () => cache.delete(cacheKey);
    }
  }, [cacheKey, invalidateRef]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (puzzleId < 0) { setLoading(false); return; }

    const cached = cache.get(cacheKey);
    if (cached) {
      // Stitch in live user rank if we now have an auth token but cache was built anonymously
      setData(cached);
      setLoading(false);
      return;
    }

    // Don't fetch for unauthenticated users
    if (!user || user.isAnonymous) { setLoading(false); return; }
    const authedUser = user;

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const headers: Record<string, string> = {};
        const token = await authedUser.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(
          `/api/scores/leaderboard?game=${encodeURIComponent(gameId)}&puzzle=${puzzleId}`,
          { headers },
        );
        if (!res.ok) throw new Error(String(res.status));
        const json: LeaderboardResponse = await res.json();
        if (!cancelled) {
          cache.set(cacheKey, json);
          setData(json);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [gameId, puzzleId, cacheKey, user]);

  const isCurrentUser = (uid: string) => uid === user?.uid;
  const userInTop = data?.players.some((p) => p.uid === user?.uid);
  const showFooterRow = data?.userEntry && !userInTop;
  const isAuthed = user && !user.isAnonymous;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", zIndex: 1060 }}
      onClick={onClose}
    >
      <div
        className="rounded-0 shadow-lg d-flex flex-column"
        style={{
          backgroundColor: "var(--bs-body-bg)",
          border: "1px solid var(--bs-border-color)",
          width: 420,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "80vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom" style={{ flexShrink: 0 }}>
          <div>
            <span className="fw-semibold small">Leaderboard</span>
            {puzzleId >= 0 && (
              <span className="text-muted small ms-2">Puzzle #{puzzleId}</span>
            )}
          </div>
          <button className="btn-close" aria-label="Close" style={{ fontSize: 12 }} onClick={onClose} />
        </div>

        {/* Body */}
        <div className="d-flex flex-column" style={{ flex: 1, minHeight: 0 }}>
          {loading && (
            <div className="d-flex align-items-center justify-content-center py-5 text-muted small gap-2">
              <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }} />
              Loading…
            </div>
          )}

          {!loading && error && (
            <div className="text-center text-muted small py-5">Failed to load leaderboard.</div>
          )}

          {!loading && !error && !isAuthed && (
            <div className="text-center text-muted small py-5 px-3">
              Sign in to view the leaderboard and see your ranking.
            </div>
          )}

          {!loading && !error && isAuthed && data && (
            <>
              {data.players.length === 0 ? (
                <div className="text-center text-muted small py-5">No scores yet | be the first!</div>
              ) : (
                <>
                  {/* Scrollable table */}
                  <div style={{ overflowY: "auto", flex: 1 }}>
                    <table className="table table-sm mb-0" style={{ fontSize: 13 }}>
                      <thead style={{ position: "sticky", top: 0, backgroundColor: "var(--bs-body-bg)", zIndex: 1 }}>
                        <tr>
                          <th className="px-3" style={{ width: 40 }}>#</th>
                          <th>Player</th>
                          <th className="text-end px-3">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.players.map((entry) => {
                          const isYou = isCurrentUser(entry.uid);
                          return (
                            <tr
                              key={entry.uid}
                              style={{
                                backgroundColor: isYou ? "var(--bs-warning-bg-subtle, #fff3cd)" : undefined,
                                fontWeight: isYou ? 600 : undefined,
                              }}
                            >
                              <td className="px-3 text-muted">{entry.rank}</td>
                              <td>
                                {entry.displayName}
                                {isYou && <span className="ms-1 badge text-bg-warning rounded-0" style={{ fontSize: 10 }}>you</span>}
                              </td>
                              <td className="text-end px-3">{entry.score.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pinned user row when outside top 100 */}
                  {showFooterRow && data.userEntry && (
                    <div style={{ flexShrink: 0, borderTop: "2px solid var(--bs-border-color)" }}>
                      <table className="table table-sm mb-0" style={{ fontSize: 13 }}>
                        <tbody>
                          <tr style={{ backgroundColor: "var(--bs-warning-bg-subtle, #fff3cd)", fontWeight: 600 }}>
                            <td className="px-3" style={{ width: 40 }}>{data.userEntry.rank}</td>
                            <td>
                              {data.userEntry.displayName}
                              <span className="ms-1 badge text-bg-warning rounded-0" style={{ fontSize: 10 }}>you</span>
                            </td>
                            <td className="text-end px-3">{data.userEntry.score.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Total count */}
                  {data.totalPlayers > 0 && (
                    <div className="px-3 py-2 text-muted small border-top" style={{ flexShrink: 0 }}>
                      {data.totalPlayers} player{data.totalPlayers !== 1 ? "s" : ""} have completed this puzzle
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
