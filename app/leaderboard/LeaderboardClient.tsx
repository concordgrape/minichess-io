"use client";

import { useState } from "react";
import type { GameLeaderboard } from "../lib/leaderboardData";
import type { LeaderboardEntry } from "../lib/scoring/types";

const DIFF_COLOR: Record<string, string> = {
  easy: "success", medium: "warning", hard: "danger",
};

const MEDAL = ["🥇", "🥈", "🥉"];

function RankCell({ rank }: { rank: number }) {
  return (
    <td className="text-center fw-semibold" style={{ width: 36 }}>
      {rank <= 3 ? (
        <span style={{ fontSize: 16 }}>{MEDAL[rank - 1]}</span>
      ) : (
        <span className="text-muted">{rank}</span>
      )}
    </td>
  );
}

function GameTable({ entries }: { entries: LeaderboardEntry[] }) {
  const ROW_H = 41; // px — keeps table height stable between tabs
  const ROWS = 10;

  return (
    <div className="table-responsive">
      <table
        className="table table-sm table-bordered table-hover mb-0"
        style={{ fontSize: 13 }}
      >
        <thead className="table-dark">
          <tr>
            <th style={{ width: 36 }} className="text-center">#</th>
            <th>Player</th>
            <th className="d-none d-sm-table-cell" style={{ width: 80 }}>Diff</th>
            <th className="text-end" style={{ width: 70 }}>Score</th>
            <th className="text-end d-none d-md-table-cell" style={{ width: 90 }}>
              <span title="Normalized 0–1000 across all difficulties">Norm.</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Pre-filled rows */}
          {entries.map((e) => (
            <tr key={e.uid} style={{ height: ROW_H }}>
              <RankCell rank={e.rank} />
              <td className="fw-semibold text-truncate" style={{ maxWidth: 160 }}>
                {e.displayName}
              </td>
              <td className="d-none d-sm-table-cell">
                <span className={`badge bg-${DIFF_COLOR[e.difficulty] ?? "secondary"} rounded-0`}>
                  {e.difficulty}
                </span>
              </td>
              <td className="text-end">{e.score.toLocaleString()}</td>
              <td className="text-end d-none d-md-table-cell text-info fw-semibold">
                {e.normalizedScore}
              </td>
            </tr>
          ))}
          {/* Empty placeholder rows so table height never shifts */}
          {Array.from({ length: ROWS - entries.length }, (_, i) => (
            <tr key={`empty-${i}`} style={{ height: ROW_H }}>
              <td className="text-center text-muted">{entries.length + i + 1}</td>
              <td className="text-muted" style={{ fontSize: 11 }}>—</td>
              <td className="d-none d-sm-table-cell" />
              <td />
              <td className="d-none d-md-table-cell" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function LeaderboardClient({ boards }: { boards: GameLeaderboard[] }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      {/* Tab bar — scrolls horizontally on mobile */}
      <div
        className="d-flex gap-1 mb-3 pb-1"
        style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}
        role="tablist"
        aria-label="Game leaderboards"
      >
        {boards.map((b, i) => (
          <button
            key={b.gameId}
            role="tab"
            aria-selected={active === i}
            aria-controls={`panel-${b.gameId}`}
            id={`tab-${b.gameId}`}
            className="btn btn-sm rounded-0 text-nowrap flex-shrink-0"
            style={{
              fontSize: 12,
              padding: "4px 10px",
              background: active === i ? "var(--bs-info)" : "var(--bs-secondary-bg)",
              color: active === i ? "#fff" : "var(--bs-body-color)",
              borderBottom: active === i ? "2px solid var(--bs-info)" : "2px solid transparent",
            }}
            onClick={() => setActive(i)}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Active panel */}
      {boards.map((b, i) => (
        <div
          key={b.gameId}
          role="tabpanel"
          id={`panel-${b.gameId}`}
          aria-labelledby={`tab-${b.gameId}`}
          hidden={active !== i}
        >
          {/* Header row: game name + top-score callout */}
          <div className="d-flex align-items-baseline gap-3 mb-2 flex-wrap">
            <h2 className="h6 fw-bold mb-0">{b.label}</h2>
            {b.entries[0] && (
              <span className="text-muted small">
                Top score: <strong>{b.entries[0].score.toLocaleString()}</strong>
                {" "}by <strong>{b.entries[0].displayName}</strong>
              </span>
            )}
          </div>
          <GameTable entries={b.entries} />
          <p className="text-muted mt-2 mb-0" style={{ fontSize: 11 }}>
            Scores update every hour · Norm. = normalized 0–1000 (difficulty-weighted)
          </p>
        </div>
      ))}
    </div>
  );
}
