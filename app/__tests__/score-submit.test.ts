/**
 * Integration tests for the real score submission route
 * (app/api/scores/submit/route.ts), run against an in-memory fake Firestore.
 *
 * Verifies:
 *  - the score is written to the exact user + puzzle document paths
 *  - the returned rank matches the player's position on that puzzle's leaderboard
 *  - replays with worse scores do not overwrite a user's best
 *  - the user's globalScore / gamesBest aggregate updates correctly
 *  - leaderboard caches are busted via revalidateTag on every submit
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { computeScore } from "../lib/scoring/formulas";

// ─── In-memory Firestore fake ─────────────────────────────────────────────────

function makeFakeDb() {
  const store = new Map<string, Record<string, unknown>>();
  let autoId = 0;

  const write = (path: string, data: Record<string, unknown>, opts?: { merge?: boolean }) => {
    if (opts?.merge) store.set(path, { ...(store.get(path) ?? {}), ...data });
    else store.set(path, { ...data });
  };
  const snap = (path: string) => {
    const d = store.get(path);
    return { exists: !!d, data: () => (d ? { ...d } : undefined) };
  };

  function docRef(path: string) {
    return {
      path,
      collection: (name: string) => colRef(`${path}/${name}`),
      get: async () => snap(path),
      set: async (data: Record<string, unknown>, opts?: { merge?: boolean }) => write(path, data, opts),
    };
  }
  function colRef(path: string) {
    return {
      path,
      doc: (id: string) => docRef(`${path}/${id}`),
      add: async (data: Record<string, unknown>) => { write(`${path}/auto-${autoId++}`, data); },
    };
  }

  const db = {
    collection: (name: string) => colRef(name),
    runTransaction: async (fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        get: async (ref: { path: string }) => snap(ref.path),
        set: (ref: { path: string }, data: Record<string, unknown>, opts?: { merge?: boolean }) =>
          write(ref.path, data, opts),
      };
      return fn(tx);
    },
  };
  return { db, store };
}

// ─── Module mocks ─────────────────────────────────────────────────────────────

const h = vi.hoisted(() => ({
  currentDb: null as unknown,
  currentUser: { uid: "user-abc", name: "Alice" },
  revalidateTag: vi.fn(),
}));

vi.mock("@/app/lib/firebase-admin", () => ({
  getAdminDb: () => h.currentDb,
  verifyFirebaseToken: async (token: string) => {
    if (token !== "good-token") throw new Error("JWTExpired: token invalid");
    return h.currentUser;
  },
}));

vi.mock("next/cache", () => ({
  revalidateTag: h.revalidateTag,
}));

import { POST } from "../api/scores/submit/route";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: unknown, token = "good-token") {
  return {
    headers: { get: (k: string) => (k === "Authorization" ? `Bearer ${token}` : null) },
    json: async () => body,
  } as never;
}

const GAME = "mate-in-1";
const PUZZLE = 7;

function seedPuzzle(store: Map<string, Record<string, unknown>>, gameId = GAME, puzzleId = PUZZLE, difficulty = "easy") {
  store.set(`games/${gameId}/puzzles/${puzzleId}`, { difficulty });
}

async function submit(rawData: Partial<{ timeSeconds: number; undoCount: number; totalAttempts: number }>, opts?: { gameId?: string; puzzleId?: number; token?: string }) {
  const res = await POST(makeRequest({
    gameId: opts?.gameId ?? GAME,
    puzzleId: opts?.puzzleId ?? PUZZLE,
    rawData: { timeSeconds: 20, undoCount: 0, totalAttempts: 1, ...rawData },
  }, opts?.token));
  return { status: res.status, body: await res.json() };
}

// ─────────────────────────────────────────────────────────────────────────────

let store: Map<string, Record<string, unknown>>;

beforeEach(() => {
  const fake = makeFakeDb();
  h.currentDb = fake.db;
  store = fake.store;
  h.currentUser = { uid: "user-abc", name: "Alice" };
  h.revalidateTag.mockClear();
  seedPuzzle(store);
});

describe("score attachment to user and puzzle", () => {
  it("writes the score to the per-puzzle scores doc keyed by the user's uid", async () => {
    const { status, body } = await submit({ timeSeconds: 20 });
    expect(status).toBe(200);
    expect(body.saved).toBe(true);

    const doc = store.get(`games/${GAME}/puzzles/${PUZZLE}/scores/user-abc`);
    expect(doc).toBeDefined();
    expect(doc).toMatchObject({
      uid: "user-abc",
      displayName: "Alice",
      gameId: GAME,
      puzzleId: PUZZLE,
      difficulty: "easy",
      score: body.score,
      normalizedScore: body.normalizedScore,
    });
  });

  it("writes the per-game best to games/{gameId}/scores/{uid}", async () => {
    const { body } = await submit({});
    const doc = store.get(`games/${GAME}/scores/user-abc`);
    expect(doc).toMatchObject({ uid: "user-abc", gameId: GAME, puzzleId: PUZZLE, score: body.score });
  });

  it("does not touch other puzzles' documents", async () => {
    seedPuzzle(store, GAME, 8);
    await submit({}); // submits to puzzle 7
    expect(store.get(`games/${GAME}/puzzles/8/scores/user-abc`)).toBeUndefined();
    expect(store.get(`games/${GAME}/puzzles/8/leaderboard/top-players`)).toBeUndefined();
  });

  it("scores on different puzzles are stored independently for the same user", async () => {
    seedPuzzle(store, GAME, 8);
    const first = await submit({ timeSeconds: 10 });                     // puzzle 7, fast
    const second = await submit({ timeSeconds: 55 }, { puzzleId: 8 });   // puzzle 8, slow

    const doc7 = store.get(`games/${GAME}/puzzles/7/scores/user-abc`);
    const doc8 = store.get(`games/${GAME}/puzzles/8/scores/user-abc`);
    expect(doc7?.score).toBe(first.body.score);
    expect(doc8?.score).toBe(second.body.score);
    expect(doc7?.score).not.toBe(doc8?.score);
    expect(doc7?.puzzleId).toBe(7);
    expect(doc8?.puzzleId).toBe(8);
  });

  it("computes the score with the server-side formula (client input can't set the score directly)", async () => {
    const rawData = { timeSeconds: 30, undoCount: 2, totalAttempts: 1 };
    const { body } = await submit(rawData);
    const expected = computeScore(rawData, GAME, "easy");
    expect(body.score).toBe(expected.score);
    expect(body.normalizedScore).toBe(expected.normalizedScore);
  });

  it("updates the user's aggregate doc (gamesBest + globalScore)", async () => {
    const { body } = await submit({});
    const userDoc = store.get("users/user-abc");
    expect(userDoc?.globalScore).toBe(body.normalizedScore);
    expect((userDoc?.gamesBest as Record<string, { normalizedScore: number; puzzleId: number }>)[GAME])
      .toMatchObject({ normalizedScore: body.normalizedScore, puzzleId: PUZZLE });
  });

  it("replaces (not adds) the previous game contribution in globalScore on improvement", async () => {
    const first = await submit({ timeSeconds: 55 });   // slow → low score
    const second = await submit({ timeSeconds: 5 });   // fast → higher score
    expect(second.body.normalizedScore).toBeGreaterThan(first.body.normalizedScore);
    const userDoc = store.get("users/user-abc");
    // globalScore must equal the single best, not the sum of both submissions
    expect(userDoc?.globalScore).toBe(second.body.normalizedScore);
  });
});

describe("puzzle leaderboard and rank", () => {
  it("returns rank 1 for the first player on a puzzle", async () => {
    const { body } = await submit({});
    expect(body.rank).toBe(1);

    const lb = store.get(`games/${GAME}/puzzles/${PUZZLE}/leaderboard/top-players`) as { players: { uid: string; rank: number }[] };
    expect(lb.players).toHaveLength(1);
    expect(lb.players[0]).toMatchObject({ uid: "user-abc", rank: 1 });
  });

  it("ranks a second, slower player below the first", async () => {
    await submit({ timeSeconds: 5 });                       // Alice, fast
    h.currentUser = { uid: "user-xyz", name: "Bob" };
    const { body } = await submit({ timeSeconds: 55 });     // Bob, slow
    expect(body.rank).toBe(2);

    const lb = store.get(`games/${GAME}/puzzles/${PUZZLE}/leaderboard/top-players`) as { players: { uid: string }[] };
    expect(lb.players.map((p) => p.uid)).toEqual(["user-abc", "user-xyz"]);
  });

  it("a faster newcomer takes rank 1 and demotes the incumbent", async () => {
    await submit({ timeSeconds: 55 });                      // Alice, slow
    h.currentUser = { uid: "user-xyz", name: "Bob" };
    const { body } = await submit({ timeSeconds: 5 });      // Bob, fast
    expect(body.rank).toBe(1);

    const lb = store.get(`games/${GAME}/puzzles/${PUZZLE}/leaderboard/top-players`) as { players: { uid: string; rank: number }[] };
    expect(lb.players[0]).toMatchObject({ uid: "user-xyz", rank: 1 });
    expect(lb.players[1]).toMatchObject({ uid: "user-abc", rank: 2 });
  });

  it("does not overwrite a user's best when a replay scores lower (rank returns null)", async () => {
    const first = await submit({ timeSeconds: 5 });         // best score
    const replay = await submit({ timeSeconds: 55 });       // worse score
    expect(replay.body.saved).toBe(true);
    expect(replay.body.rank).toBeNull();                    // not a new best → no rank

    const doc = store.get(`games/${GAME}/puzzles/${PUZZLE}/scores/user-abc`);
    expect(doc?.score).toBe(first.body.score);              // best preserved
    const lb = store.get(`games/${GAME}/puzzles/${PUZZLE}/leaderboard/top-players`) as { players: { score: number }[] };
    expect(lb.players).toHaveLength(1);                     // no duplicate entry
    expect(lb.players[0].score).toBe(first.body.score);
  });

  it("keeps one leaderboard entry per user after an improvement", async () => {
    await submit({ timeSeconds: 55 });
    const better = await submit({ timeSeconds: 5 });
    expect(better.body.rank).toBe(1);
    const lb = store.get(`games/${GAME}/puzzles/${PUZZLE}/leaderboard/top-players`) as { players: { uid: string; score: number }[]; totalPlayers: number };
    expect(lb.players).toHaveLength(1);
    expect(lb.totalPlayers).toBe(1);
    expect(lb.players[0].score).toBe(better.body.score);
  });
});

describe("cache invalidation", () => {
  it("busts both the game and per-puzzle leaderboard tags on submit", async () => {
    await submit({});
    const tags = h.revalidateTag.mock.calls.map((c) => c[0]);
    expect(tags).toContain(`lb-${GAME}`);
    expect(tags).toContain(`puzzle-lb-${GAME}-${PUZZLE}`);
  });

  it("busts the tag for the submitted puzzle, not another one", async () => {
    seedPuzzle(store, GAME, 8);
    await submit({}, { puzzleId: 8 });
    const tags = h.revalidateTag.mock.calls.map((c) => c[0]);
    expect(tags).toContain(`puzzle-lb-${GAME}-8`);
    expect(tags).not.toContain(`puzzle-lb-${GAME}-7`);
  });
});

describe("request validation", () => {
  it("rejects unauthenticated requests with 401", async () => {
    const { status, body } = await submit({}, { token: "bad-token" });
    expect(status).toBe(401);
    expect(body.saved).toBe(false);
  });

  it("rejects unknown puzzles with 400 and writes nothing", async () => {
    const { status } = await submit({}, { puzzleId: 999 });
    expect(status).toBe(400);
    expect(store.get(`games/${GAME}/puzzles/999/scores/user-abc`)).toBeUndefined();
  });

  it("rejects implausible times with 422 and writes nothing", async () => {
    const { status, body } = await submit({ timeSeconds: 999999 });
    expect(status).toBe(422);
    expect(body.reason).toBe("implausible_time");
    expect(store.get(`games/${GAME}/puzzles/${PUZZLE}/scores/user-abc`)).toBeUndefined();
  });

  it("rejects an unknown game with 400", async () => {
    const { status } = await submit({}, { gameId: "not-a-game" });
    expect(status).toBe(400);
  });
});
