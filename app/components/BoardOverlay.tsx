"use client";

import { useState } from "react";
import { useGamePhase } from "../lib/GameStartContext";

const MEDAL = ["🥇", "🥈", "🥉"];

/**
 * Wrap just the <Board> element inside a game component with this.
 * It renders a blurry overlay over the board only | not the info panel.
 */
export default function BoardOverlay({ children, ready = true }: { children: React.ReactNode; ready?: boolean }) {
  const { phase, leaderboard, loadingLb, handleStart, resetGame } = useGamePhase();
  const [fading, setFading] = useState(false);

  function onStart() {
    setFading(true);
    setTimeout(() => {
      handleStart(() => setFading(false));
    }, 380);
  }

  const overlayBase: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    transition: "opacity 0.38s ease",
    borderRadius: 2,
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {children}

      {phase === "waiting" && (
        <div style={{ ...overlayBase, opacity: fading ? 0 : 1, pointerEvents: fading ? "none" : "auto" }}>
          <div className="text-center px-3" style={{ maxWidth: 260 }}>
            <div style={{ fontSize: 48, lineHeight: 1 }}>♟</div>
            <h3 className="h5 fw-bold text-white mt-2 mb-2">Ready to play?</h3>
            <p className="text-white mb-4" style={{ opacity: 0.75, fontSize: 13 }}>
              Timer starts on click. Solve faster for more points.
            </p>
            <button
              className="btn btn-light rounded-0 px-5 py-2 fw-bold"
              style={{ fontSize: 15, letterSpacing: 0.5, opacity: ready ? 1 : 0.5 }}
              onClick={onStart}
              disabled={!ready}
            >
              {ready ? "▶ Start Game" : "Loading…"}
            </button>
          </div>
        </div>
      )}

      {phase === "complete" && (
        <div style={{ ...overlayBase, opacity: 1, pointerEvents: "auto", alignItems: "flex-start", paddingTop: 24, overflowY: "auto" }}>
          <div style={{ width: "100%", maxWidth: 300, padding: "0 12px" }}>
            <div className="bg-body border rounded-0 p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div style={{ fontSize: 20 }}>✅</div>
                  <h4 className="h6 fw-bold mb-0 mt-1">Puzzle Complete!</h4>
                </div>
                <button
                  className="btn btn-sm btn-outline-secondary rounded-0"
                  onClick={resetGame}
                >
                  Play again
                </button>
              </div>

              <p className="text-muted mb-2" style={{ fontSize: 11 }}>
                Score submitted. Leaderboard updates within the hour.
              </p>

              <div className="fw-semibold mb-1" style={{ fontSize: 12 }}>Top Players</div>

              {loadingLb && (
                <p className="text-muted text-center py-2 mb-0" style={{ fontSize: 12 }}>Loading…</p>
              )}

              {!loadingLb && leaderboard && leaderboard.length === 0 && (
                <p className="text-muted text-center py-2 mb-0" style={{ fontSize: 12 }}>
                  No scores yet | be the first!
                </p>
              )}

              {!loadingLb && leaderboard && leaderboard.length > 0 && (
                <table className="table table-sm table-bordered mb-0" style={{ fontSize: 11 }}>
                  <thead className="table-dark">
                    <tr>
                      <th style={{ width: 26 }} className="text-center">#</th>
                      <th>Player</th>
                      <th className="text-end" style={{ width: 56 }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((e) => (
                      <tr key={e.uid}>
                        <td className="text-center">
                          {e.rank <= 3 ? MEDAL[e.rank - 1] : <span className="text-muted">{e.rank}</span>}
                        </td>
                        <td
                          className="fw-semibold"
                          style={{ maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                          {e.displayName}
                        </td>
                        <td className="text-end">{e.score.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
