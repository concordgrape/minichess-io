"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface PuzzleMeta {
  id: number;
  difficulty: string;
}

interface Props {
  gameId: string;
  currentId: number;
  onPuzzleLoaded: (data: Record<string, unknown>) => void;
  getStatus?: (id: number) => "completed" | "inProgress" | null;
}

const DIFF_COLOR: Record<string, string> = {
  easy: "success",
  medium: "warning",
  hard: "danger",
};

function StatusDot({ status }: { status: "completed" | "inProgress" | null }) {
  if (status === "completed") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="7" cy="7" r="6.5" fill="#198754" />
        <path d="M3.5 7l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "inProgress") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="7" cy="7" r="6.5" fill="#0d6efd" />
      </svg>
    );
  }
  return <span style={{ width: 14, flexShrink: 0 }} />;
}

function Spinner() {
  return (
    <div className="d-flex align-items-center justify-content-center gap-2 py-3 text-muted small">
      <span
        className="spinner-border spinner-border-sm"
        style={{ width: 14, height: 14, borderWidth: 2 }}
      />
      Loading more…
    </div>
  );
}

async function fetchPage(gameId: string, after?: number): Promise<{ puzzles: PuzzleMeta[]; hasMore: boolean }> {
  const url = after !== undefined
    ? `/api/puzzles/${gameId}?after=${after}`
    : `/api/puzzles/${gameId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

async function loadPuzzleData(gameId: string, id: number): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`/api/puzzles/${gameId}/${id}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const SESSION_KEY = (gameId: string) => `rp_${gameId}`;

export default function PuzzleSelectDropdown({ gameId, currentId, onPuzzleLoaded, getStatus }: Props) {
  const [open, setOpen] = useState(false);
  const [puzzles, setPuzzles] = useState<PuzzleMeta[]>([]);
  const [maxId, setMaxId] = useState<number | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [randomLoading, setRandomLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(false);

  // On mount / gameId change: reset list, fetch first page, auto-load a random puzzle.
  // The cleanup `cancelled` flag prevents stale responses from a previous run
  // (React Strict Mode fires effects twice; without this the second run could race
  // the first and show a flash of the JSON fallback before the real puzzle arrives).
  useEffect(() => {
    let cancelled = false;

    setPuzzles([]);
    setHasMore(false);
    setMaxId(null);

    const loadJsonFallback = () => {
      if (cancelled) return;
      fetch(`/games/${gameId}.json`)
        .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .then((data) => { if (!cancelled) onPuzzleLoaded(data); })
        .catch(() => {});
    };

    fetchPage(gameId).then(({ puzzles: p, hasMore: more }) => {
      if (cancelled) return;
      setPuzzles(p);
      setHasMore(more);
      if (p.length === 0) { loadJsonFallback(); return; }

      const max = p[0].id;
      setMaxId(max);

      const key = SESSION_KEY(gameId);
      const stored = sessionStorage.getItem(key);
      const randomId = stored
        ? parseInt(stored, 10)
        : Math.floor(Math.random() * max) + 1;

      if (!stored) sessionStorage.setItem(key, String(randomId));

      loadPuzzleData(gameId, randomId).then((data) => {
        if (cancelled) return;
        if (data) { onPuzzleLoaded(data); return; }
        // Specific ID not found — try the first known puzzle instead
        loadPuzzleData(gameId, p[0].id).then((fallback) => {
          if (!cancelled && fallback) onPuzzleLoaded(fallback);
        });
      });
    }).catch(() => loadJsonFallback());

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  // Load first page when modal opens (if not already loaded)
  useEffect(() => {
    if (!open || puzzles.length > 0) return;
    setInitialLoading(true);
    fetchPage(gameId)
      .then(({ puzzles: p, hasMore: more }) => {
        setPuzzles(p);
        setHasMore(more);
        if (p.length > 0) setMaxId(p[0].id);
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, [open, gameId, puzzles.length]);

  // Infinite scroll via IntersectionObserver on sentinel div
  useEffect(() => {
    if (!open || !hasMore || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || fetchingRef.current || !hasMore) return;
        fetchingRef.current = true;
        setLoadingMore(true);
        const lastId = puzzles[puzzles.length - 1]?.id;
        fetchPage(gameId, lastId)
          .then(({ puzzles: more, hasMore: stillMore }) => {
            setPuzzles((prev) => [...prev, ...more]);
            setHasMore(stillMore);
          })
          .catch(() => {})
          .finally(() => {
            setLoadingMore(false);
            fetchingRef.current = false;
          });
      },
      { root: listRef.current, threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [open, hasMore, puzzles, gameId]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const selectPuzzle = useCallback(async (id: number) => {
    if (id === currentId) { setOpen(false); return; }
    setLoadingId(id);
    const data = await loadPuzzleData(gameId, id);
    if (data) { onPuzzleLoaded(data); setOpen(false); }
    setLoadingId(null);
  }, [gameId, currentId, onPuzzleLoaded]);

  const pickRandom = useCallback(async () => {
    const max = maxId ?? puzzles[0]?.id;
    if (!max) return;
    setRandomLoading(true);
    const randomId = Math.floor(Math.random() * max) + 1;
    sessionStorage.setItem(SESSION_KEY(gameId), String(randomId));
    const data = await loadPuzzleData(gameId, randomId);
    if (data) onPuzzleLoaded(data);
    setRandomLoading(false);
  }, [gameId, maxId, puzzles, onPuzzleLoaded]);

  return (
    <>
      {/* Button row */}
      <div className="d-flex gap-2">
        <button
          className="btn btn-sm btn-outline-secondary rounded-0 d-flex align-items-center gap-1"
          onClick={() => setOpen(true)}
          title="Previous puzzles"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>Past puzzles</span>
        </button>

        <button
          className="btn btn-sm btn-outline-secondary rounded-0 d-flex align-items-center gap-1"
          onClick={pickRandom}
          disabled={randomLoading}
          title="Load a random puzzle"
        >
          {randomLoading ? (
            <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }} />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8"/>
              <line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/>
              <line x1="15" y1="15" x2="21" y2="21"/>
            </svg>
          )}
          <span>Random</span>
        </button>
      </div>

      {open && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)", zIndex: 1050 }}
          onClick={() => setOpen(false)}
        >
          <div
            className="rounded-0 shadow-lg"
            style={{
              backgroundColor: "var(--bs-body-bg)",
              border: "1px solid var(--bs-border-color)",
              width: 320,
              maxHeight: 500,
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom" style={{ flexShrink: 0 }}>
              <span className="fw-semibold small">Past Puzzles</span>
              <button
                className="btn-close"
                style={{ fontSize: 12 }}
                onClick={() => setOpen(false)}
              />
            </div>

            {/* List */}
            <div ref={listRef} style={{ overflowY: "auto", overscrollBehavior: "contain", flex: 1 }}>
              {initialLoading && (
                <div className="text-center text-muted small py-4">Loading…</div>
              )}
              {!initialLoading && puzzles.length === 0 && (
                <div className="text-center text-muted small py-4">No past puzzles available.</div>
              )}
              {puzzles.map((p) => {
                const isCurrent = p.id === currentId;
                const isLoading = loadingId === p.id;
                const status = getStatus?.(p.id) ?? null;
                return (
                  <button
                    key={p.id}
                    className={`w-100 border-0 border-bottom text-start px-3 py-2 d-flex align-items-center gap-2 ${isCurrent ? "fw-semibold" : ""}`}
                    style={{
                      backgroundColor: isCurrent ? "var(--bs-secondary-bg)" : "transparent",
                      cursor: isCurrent ? "default" : "pointer",
                      fontSize: 13,
                      color: "var(--bs-body-color)",
                    }}
                    onClick={() => selectPuzzle(p.id)}
                    disabled={isLoading}
                  >
                    <StatusDot status={status} />
                    <span className="flex-grow-1">Game #{p.id}</span>
                    {isCurrent && (
                      <span className="text-muted" style={{ fontSize: 11 }}>▶</span>
                    )}
                    {isLoading ? (
                      <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }} />
                    ) : (
                      <span className={`badge text-bg-${DIFF_COLOR[p.difficulty] ?? "secondary"} rounded-0`} style={{ fontSize: 10 }}>
                        {p.difficulty}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Sentinel for IntersectionObserver + loading indicator */}
              {hasMore && (
                <div ref={sentinelRef}>
                  {loadingMore && <Spinner />}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
