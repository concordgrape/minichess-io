import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/app/lib/firebase-admin";
import Breadcrumbs from "@/app/components/Breadcrumbs";

export const metadata = {
  title: "Top Players",
  description: "The highest-scoring players on Chess Puzzles, ranked by total score across all puzzle games.",
  openGraph: {
    title: "Top Players | Chess Puzzles",
    description: "See who's leading the all-time rankings across every chess puzzle on Chess Puzzles.",
    url: "https://chesspuzzles.online/top-players",
  },
};

export const revalidate = 7200;

interface TopPlayer {
  uid: string;
  username: string;
  globalScore: number;
  gamesPlayed: number;
}

const fetchTopPlayers = unstable_cache(
  async (): Promise<{ players: TopPlayer[]; fetchedAt: string }> => {
    try {
      const snap = await getAdminDb()
        .collection("users")
        .orderBy("globalScore", "desc")
        .limit(50)
        .get();

      const players = snap.docs.map((doc) => {
        const d = doc.data();
        const gamesBest = (d.gamesBest ?? {}) as Record<string, unknown>;
        return {
          uid: doc.id,
          username: (d.username as string | undefined) || `Player ${doc.id.slice(0, 6)}`,
          globalScore: Math.round((d.globalScore as number | undefined) ?? 0),
          gamesPlayed: Object.keys(gamesBest).length,
        };
      });

      return { players, fetchedAt: new Date().toISOString() };
    } catch (e) {
      console.error("[top-players] Firestore error:", e);
      return { players: [], fetchedAt: new Date().toISOString() };
    }
  },
  ["top-players-global"],
  { revalidate: 7200, tags: ["top-players"] }
);

const MEDAL = ["🥇", "🥈", "🥉"];

export default async function TopPlayersPage() {
  const { players, fetchedAt } = await fetchTopPlayers();

  const lastUpdated = new Date(fetchedAt).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  });

  return (
    <div>
      <Breadcrumbs items={[
        { name: "Home", url: "https://chesspuzzles.online" },
        { name: "Top Players", url: "https://chesspuzzles.online/top-players" },
      ]} />
      <h1 className="h4 mb-1">Top Players</h1>
      <p className="text-muted mb-1">
        All-time rankings by total score across every puzzle game.
      </p>
      <p className="text-muted mb-4" style={{ fontSize: 12 }}>
        Last updated: {lastUpdated}
      </p>

      {players.length === 0 ? (
        <p className="text-muted">No scores yet — be the first!</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover mb-0" style={{ fontSize: 14 }}>
            <thead className="table-dark">
              <tr>
                <th style={{ width: 52 }} className="text-center">#</th>
                <th>Player</th>
                <th className="text-center" style={{ width: 90 }}>Games</th>
                <th className="text-end" style={{ width: 110 }}>Total Score</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => {
                const rank = i + 1;
                return (
                  <tr key={p.uid}>
                    <td className="text-center fw-semibold">
                      {rank <= 3 ? (
                        <span title={`#${rank}`}>{MEDAL[rank - 1]}</span>
                      ) : (
                        <span className="text-muted">{rank}</span>
                      )}
                    </td>
                    <td className="fw-semibold">{p.username}</td>
                    <td className="text-center text-muted">{p.gamesPlayed}</td>
                    <td className="text-end">
                      <span className="badge text-bg-warning rounded-0" style={{ fontSize: 13, padding: "4px 8px" }}>
                        ★ {p.globalScore.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
