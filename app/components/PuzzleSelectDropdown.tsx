"use client";

import { useState, useEffect, useCallback } from "react";

interface PuzzleMeta {
  id: number;
  difficulty: string;
  releaseDate: number | null;
}

interface Props {
  gameId: string;
  currentId: number;
  onPuzzleLoaded: (data: Record<string, unknown>) => void;
}

const DIFF_COLOR: Record<string, string> = {
  easy: "success",
  medium: "warning",
  hard: "danger",
};

function formatDate(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PuzzleSelectDropdown({ gameId, currentId, onPuzzleLoaded }: Props) {
  const [open, setOpen] = useState(false);
  const [puzzles, setPuzzles] = useState<PuzzleMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Fetch the list when modal opens for the first time
  useEffect(() => {
    if (!open || puzzles.length > 0) return;
    setLoading(true);
    fetch(`/api/puzzles/${gameId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPuzzles(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, gameId, puzzles.length]);

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
    try {
      const res = await fetch(`/api/puzzles/${gameId}/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      onPuzzleLoaded(data);
      setOpen(false);
    } catch {
      // silently fail
    } finally {
      setLoadingId(null);
    }
  }, [gameId, currentId, onPuzzleLoaded]);

  return (
    <>
      {/* Calendar button */}
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

      {/* Modal backdrop */}
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
              maxHeight: "70vh",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
              <span className="fw-semibold small">Past Puzzles</span>
              <button
                className="btn-close"
                style={{ fontSize: 12 }}
                onClick={() => setOpen(false)}
              />
            </div>

            {/* List */}
            <div style={{ overflowY: "auto", overscrollBehavior: "contain" }}>
              {loading && (
                <div className="text-center text-muted small py-4">Loading…</div>
              )}
              {!loading && puzzles.length === 0 && (
                <div className="text-center text-muted small py-4">No past puzzles available.</div>
              )}
              {puzzles.map((p) => {
                const isCurrent = p.id === currentId;
                const isLoading = loadingId === p.id;
                return (
                  <button
                    key={p.id}
                    className={`w-100 border-0 border-bottom text-start px-3 py-2 d-flex align-items-center justify-content-between gap-2 ${isCurrent ? "fw-semibold" : ""}`}
                    style={{
                      backgroundColor: isCurrent
                        ? "var(--bs-secondary-bg)"
                        : "transparent",
                      cursor: isCurrent ? "default" : "pointer",
                      fontSize: 13,
                      color: "var(--bs-body-color)",
                    }}
                    onClick={() => selectPuzzle(p.id)}
                    disabled={isLoading}
                  >
                    <span className="d-flex align-items-center gap-2">
                      {isCurrent && (
                        <span className="text-muted" style={{ fontSize: 11 }}>▶</span>
                      )}
                      <span>{formatDate(p.releaseDate)}</span>
                    </span>
                    <span className="d-flex align-items-center gap-2">
                      {isLoading && (
                        <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }} />
                      )}
                      <span className={`badge text-bg-${DIFF_COLOR[p.difficulty] ?? "secondary"} rounded-0`} style={{ fontSize: 10 }}>
                        {p.difficulty}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
