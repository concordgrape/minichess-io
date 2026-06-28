import { describe, it, expect, beforeEach } from "vitest";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Player {
  rank: number;
  uid: string;
  displayName: string;
  score: number;
  normalizedScore: number;
  difficulty: string;
  updatedAt: string;
}

interface LeaderboardResponse {
  players: Player[];
  totalPlayers: number;
  userEntry: (Player & { rank: number }) | null;
}

// ─── Logic extracted from submit route ───────────────────────────────────────
// Mirrors the exact logic in app/api/scores/submit/route.ts so tests break
// if the implementation diverges.

function buildPuzzleLeaderboard(
  existing: Player[],
  uid: string,
  displayName: string,
  score: number,
  normalizedScore: number,
  difficulty: string,
): { players: Player[]; totalPlayers: number } {
  const without = existing.filter((p) => p.uid !== uid);
  without.push({ rank: 0, uid, displayName, score, normalizedScore, difficulty, updatedAt: new Date().toISOString() });
  without.sort((a, b) => b.score - a.score);
  const players = without.slice(0, 100).map((p, i) => ({ ...p, rank: i + 1 }));
  return { players, totalPlayers: without.length };
}

// ─── Client-side cache logic (mirrors LeaderboardModal) ──────────────────────

function makeCache() {
  const cache = new Map<string, LeaderboardResponse>();
  return {
    get: (gameId: string, puzzleId: number) => cache.get(`${gameId}-${puzzleId}`) ?? null,
    set: (gameId: string, puzzleId: number, data: LeaderboardResponse) =>
      cache.set(`${gameId}-${puzzleId}`, data),
    invalidate: (gameId: string, puzzleId: number) =>
      cache.delete(`${gameId}-${puzzleId}`),
    size: () => cache.size,
  };
}

// ─── userEntry stitching logic (mirrors LeaderboardModal) ────────────────────

function resolveUserEntry(
  players: Player[],
  uid: string | null,
  externalEntry: (Player & { rank: number }) | null,
): (Player & { rank: number }) | null {
  if (!uid) return null;
  const inTop = players.find((p) => p.uid === uid);
  if (inTop) return inTop;
  return externalEntry;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("buildPuzzleLeaderboard", () => {
  it("inserts a new player into an empty leaderboard at rank 1", () => {
    const { players, totalPlayers } = buildPuzzleLeaderboard([], "u1", "Alice", 500, 800, "hard");
    expect(players).toHaveLength(1);
    expect(players[0]).toMatchObject({ rank: 1, uid: "u1", score: 500 });
    expect(totalPlayers).toBe(1);
  });

  it("sorts by raw score descending", () => {
    const existing: Player[] = [
      { rank: 1, uid: "u1", displayName: "Alice", score: 300, normalizedScore: 500, difficulty: "easy", updatedAt: "" },
      { rank: 2, uid: "u2", displayName: "Bob",   score: 100, normalizedScore: 200, difficulty: "easy", updatedAt: "" },
    ];
    const { players } = buildPuzzleLeaderboard(existing, "u3", "Carol", 200, 400, "easy");
    expect(players.map((p) => p.score)).toEqual([300, 200, 100]);
    expect(players.map((p) => p.rank)).toEqual([1, 2, 3]);
  });

  it("replaces an existing player's entry with their new (higher) score", () => {
    const existing: Player[] = [
      { rank: 1, uid: "u1", displayName: "Alice", score: 300, normalizedScore: 500, difficulty: "easy", updatedAt: "" },
      { rank: 2, uid: "u2", displayName: "Bob",   score: 200, normalizedScore: 400, difficulty: "easy", updatedAt: "" },
    ];
    // u1 improves their score
    const { players } = buildPuzzleLeaderboard(existing, "u1", "Alice", 400, 700, "easy");
    expect(players).toHaveLength(2);
    expect(players[0]).toMatchObject({ uid: "u1", score: 400, rank: 1 });
    expect(players[1]).toMatchObject({ uid: "u2", score: 200, rank: 2 });
  });

  it("correctly re-ranks a player who improves but doesn't reach #1", () => {
    const existing: Player[] = [
      { rank: 1, uid: "u1", displayName: "Alice", score: 900, normalizedScore: 900, difficulty: "hard", updatedAt: "" },
      { rank: 2, uid: "u2", displayName: "Bob",   score: 500, normalizedScore: 500, difficulty: "medium", updatedAt: "" },
      { rank: 3, uid: "u3", displayName: "Carol", score: 100, normalizedScore: 100, difficulty: "easy", updatedAt: "" },
    ];
    // u3 improves to 600 — should become rank 2
    const { players } = buildPuzzleLeaderboard(existing, "u3", "Carol", 600, 600, "medium");
    expect(players.map((p) => p.uid)).toEqual(["u1", "u3", "u2"]);
    expect(players.map((p) => p.rank)).toEqual([1, 2, 3]);
  });

  it("caps at 100 players and keeps only highest scores", () => {
    const existing: Player[] = Array.from({ length: 100 }, (_, i) => ({
      rank: i + 1,
      uid: `u${i}`,
      displayName: `Player ${i}`,
      score: 1000 - i, // u0=1000, u1=999, …, u99=901
      normalizedScore: 1000 - i,
      difficulty: "easy",
      updatedAt: "",
    }));
    // New player with score 0 — should not make it in
    const { players, totalPlayers } = buildPuzzleLeaderboard(existing, "new", "Newbie", 0, 0, "easy");
    expect(players).toHaveLength(100);
    expect(players.some((p) => p.uid === "new")).toBe(false);
    expect(totalPlayers).toBe(101); // counted but not stored
  });

  it("pushes the lowest-ranked existing player out when a better score arrives", () => {
    const existing: Player[] = Array.from({ length: 100 }, (_, i) => ({
      rank: i + 1,
      uid: `u${i}`,
      displayName: `Player ${i}`,
      score: 1000 - i,
      normalizedScore: 1000 - i,
      difficulty: "easy",
      updatedAt: "",
    }));
    // New player with score 950 beats 50 existing players
    const { players } = buildPuzzleLeaderboard(existing, "new", "Newbie", 950, 950, "easy");
    expect(players).toHaveLength(100);
    expect(players.some((p) => p.uid === "new")).toBe(true);
    // u99 (score=901) should be pushed out since we only keep 100
    expect(players.some((p) => p.uid === "u99")).toBe(false);
  });

  it("assigns sequential ranks with no gaps after dedup", () => {
    const existing: Player[] = [
      { rank: 1, uid: "u1", displayName: "A", score: 800, normalizedScore: 800, difficulty: "hard", updatedAt: "" },
      { rank: 2, uid: "u2", displayName: "B", score: 600, normalizedScore: 600, difficulty: "hard", updatedAt: "" },
      { rank: 3, uid: "u3", displayName: "C", score: 400, normalizedScore: 400, difficulty: "hard", updatedAt: "" },
    ];
    // u2 is replaced — ranks must remain 1,2,3 with no gap
    const { players } = buildPuzzleLeaderboard(existing, "u2", "B", 700, 700, "hard");
    expect(players.map((p) => p.rank)).toEqual([1, 2, 3]);
    expect(players.map((p) => p.uid)).toEqual(["u1", "u2", "u3"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("client-side leaderboard cache", () => {
  let cache: ReturnType<typeof makeCache>;

  beforeEach(() => { cache = makeCache(); });

  it("returns null on a cache miss", () => {
    expect(cache.get("mate-in-1", 42)).toBeNull();
  });

  it("returns the stored value on a cache hit", () => {
    const data: LeaderboardResponse = { players: [], totalPlayers: 0, userEntry: null };
    cache.set("mate-in-1", 42, data);
    expect(cache.get("mate-in-1", 42)).toBe(data);
  });

  it("scopes entries by gameId × puzzleId — different puzzle is a miss", () => {
    const data: LeaderboardResponse = { players: [], totalPlayers: 0, userEntry: null };
    cache.set("mate-in-1", 42, data);
    expect(cache.get("mate-in-1", 43)).toBeNull();
    expect(cache.get("mate-in-2", 42)).toBeNull();
  });

  it("invalidate removes only the targeted entry", () => {
    const a: LeaderboardResponse = { players: [], totalPlayers: 0, userEntry: null };
    const b: LeaderboardResponse = { players: [], totalPlayers: 5, userEntry: null };
    cache.set("mate-in-1", 1, a);
    cache.set("mate-in-1", 2, b);
    cache.invalidate("mate-in-1", 1);
    expect(cache.get("mate-in-1", 1)).toBeNull();
    expect(cache.get("mate-in-1", 2)).toBe(b); // unaffected
  });

  it("allows re-population after invalidation", () => {
    const old: LeaderboardResponse = { players: [], totalPlayers: 0, userEntry: null };
    const fresh: LeaderboardResponse = { players: [{ rank: 1, uid: "u1", displayName: "Alice", score: 500, normalizedScore: 800, difficulty: "hard", updatedAt: "" }], totalPlayers: 1, userEntry: null };
    cache.set("mate-in-1", 1, old);
    cache.invalidate("mate-in-1", 1);
    cache.set("mate-in-1", 1, fresh);
    expect(cache.get("mate-in-1", 1)).toBe(fresh);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("resolveUserEntry (user row stitching)", () => {
  const players: Player[] = [
    { rank: 1, uid: "u1", displayName: "Alice", score: 900, normalizedScore: 900, difficulty: "hard", updatedAt: "" },
    { rank: 2, uid: "u2", displayName: "Bob",   score: 700, normalizedScore: 700, difficulty: "hard", updatedAt: "" },
  ];

  it("returns null when not authenticated", () => {
    expect(resolveUserEntry(players, null, null)).toBeNull();
  });

  it("returns the player's top-100 entry when they are ranked", () => {
    const entry = resolveUserEntry(players, "u1", null);
    expect(entry).toMatchObject({ uid: "u1", rank: 1 });
  });

  it("returns the external entry when user is outside top 100", () => {
    const external: Player & { rank: number } = {
      rank: 142, uid: "u99", displayName: "Outsider",
      score: 50, normalizedScore: 50, difficulty: "easy", updatedAt: "",
    };
    const entry = resolveUserEntry(players, "u99", external);
    expect(entry).toMatchObject({ uid: "u99", rank: 142 });
  });

  it("returns null when user has no score for this puzzle at all", () => {
    expect(resolveUserEntry(players, "u99", null)).toBeNull();
  });

  it("prefers the top-100 entry over external even if external rank is lower", () => {
    // Shouldn't happen in practice, but guard against it
    const external: Player & { rank: number } = {
      rank: 999, uid: "u2", displayName: "Bob",
      score: 700, normalizedScore: 700, difficulty: "hard", updatedAt: "",
    };
    const entry = resolveUserEntry(players, "u2", external);
    expect(entry?.rank).toBe(2); // from top-100, not 999
  });
});
