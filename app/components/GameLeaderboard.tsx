import { unstable_cache } from "next/cache";
import { getAdminDb } from "../lib/firebase-admin";
import type { GameId } from "../lib/scoring/types";

const DIFF_COLOR: Record<string, string> = {
  easy: "text-success", medium: "text-warning", hard: "text-danger",
};

type TopPlayer = {
  rank: number; uid: string; displayName: string;
  score: number; normalizedScore: number; difficulty: string;
};

const fetchGameLeaderboard = (gameId: GameId) =>
  unstable_cache(
    async (): Promise<TopPlayer[]> => {
      try {
        const snap = await getAdminDb()
          .collection("games").doc(gameId)
          .collection("leaderboard").doc("top-players")
          .get();
        return ((snap.data()?.players ?? []) as TopPlayer[]).slice(0, 10);
      } catch {
        return [];
      }
    },
    [`game-lb-${gameId}`],
    { revalidate: 3600, tags: [`lb-${gameId}`] }
  )();

const ROW_H = 36;
const ROWS = 10;
const MEDAL = ["🥇", "🥈", "🥉"];

export default async function GameLeaderboard({ gameId }: { gameId: GameId }) {
  const entries = await fetchGameLeaderboard(gameId);

  return (
    <div className="mt-4 pt-3 border-top">
      <div className="d-flex align-items-baseline justify-content-between mb-2">
        <h2 className="h6 fw-bold mb-0">Top Players</h2>
        <span className="text-muted" style={{ fontSize: 11 }}>updates after each submission</span>
      </div>

      <div className="table-responsive">
        <table className="table table-sm table-bordered mb-0" style={{ fontSize: 12 }}>
          <thead className="table-dark">
            <tr>
              <th style={{ width: 32 }} className="text-center">#</th>
              <th>Player</th>
              <th className="d-none d-sm-table-cell" style={{ width: 64 }}>Diff</th>
              <th className="text-end" style={{ width: 64 }}>Score</th>
              <th className="text-end d-none d-md-table-cell" style={{ width: 72 }} title="Normalized 0–1000">
                Norm.
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.uid} style={{ height: ROW_H }}>
                <td className="text-center fw-semibold" style={{ fontSize: e.rank <= 3 ? 14 : 12 }}>
                  {e.rank <= 3 ? MEDAL[e.rank - 1] : <span className="text-muted">{e.rank}</span>}
                </td>
                <td style={{ maxWidth: 160 }}>
                  <div className="fw-semibold text-truncate">{e.displayName}</div>
                  <div className="text-muted" style={{ fontSize: 10, fontFamily: "monospace" }}>
                    {e.uid.slice(0, 12)}…
                  </div>
                </td>
                <td className={`d-none d-sm-table-cell fw-semibold ${DIFF_COLOR[e.difficulty] ?? ""}`}>
                  {e.difficulty}
                </td>
                <td className="text-end">{e.score.toLocaleString()}</td>
                <td className="text-end text-info fw-semibold d-none d-md-table-cell">
                  {e.normalizedScore}
                </td>
              </tr>
            ))}
            {Array.from({ length: ROWS - entries.length }, (_, i) => (
              <tr key={`empty-${i}`} style={{ height: ROW_H }}>
                <td className="text-center text-muted" style={{ fontSize: 11 }}>
                  {entries.length + i + 1}
                </td>
                <td className="text-muted" style={{ fontSize: 11 }}>—</td>
                <td className="d-none d-sm-table-cell" />
                <td />
                <td className="d-none d-md-table-cell" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
