/**
 * Tests for the cached GET /api/scores/user/[userId] route.
 *
 * Verifies the Firestore read is wrapped in unstable_cache with a per-user
 * tag (`user-scores-{uid}`) and a 5-minute TTL — the same tag the submit
 * route busts, so a fresh score invalidates the cache immediately.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

const h = vi.hoisted(() => ({
  users: new Map<string, Record<string, unknown>>(),
  // record every unstable_cache registration: [keyParts, options]
  cacheRegistrations: [] as { keyParts: string[]; options: Record<string, unknown> }[],
  firestoreReads: 0,
  cacheStore: new Map<string, unknown>(),
}));

vi.mock("@/app/lib/firebase-admin", () => ({
  getAdminDb: () => ({
    collection: (name: string) => ({
      doc: (id: string) => ({
        get: async () => {
          h.firestoreReads++;
          const d = h.users.get(`${name}/${id}`);
          return { exists: !!d, data: () => d };
        },
      }),
    }),
  }),
}));

vi.mock("next/cache", () => ({
  // Simulated unstable_cache: records registration, memoizes by key like Next does
  unstable_cache: (fn: () => Promise<unknown>, keyParts: string[], options: Record<string, unknown>) => {
    h.cacheRegistrations.push({ keyParts, options });
    const key = keyParts.join("|");
    return async () => {
      if (h.cacheStore.has(key)) return h.cacheStore.get(key);
      const result = await fn();
      h.cacheStore.set(key, result);
      return result;
    };
  },
}));

import { GET } from "../api/scores/user/[userId]/route";

function makeRequest() {
  return {} as never;
}
function makeParams(userId: string) {
  return { params: Promise.resolve({ userId }) };
}

beforeEach(() => {
  h.users.clear();
  h.cacheStore.clear();
  h.cacheRegistrations.length = 0;
  h.firestoreReads = 0;
});

describe("GET /api/scores/user/[userId]", () => {
  it("returns the user's scores", async () => {
    h.users.set("users/u1", {
      globalScore: 750,
      gamesBest: { takes: { score: 500 } },
      difficultyCompletions: { takes: { easy: 2 } },
    });
    const res = await GET(makeRequest(), makeParams("u1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.globalScore).toBe(750);
    expect(body.difficultyCompletions.takes.easy).toBe(2);
  });

  it("returns 404 for unknown users", async () => {
    const res = await GET(makeRequest(), makeParams("nobody"));
    expect(res.status).toBe(404);
  });

  it("registers the cache with the per-user tag and 5-minute TTL", async () => {
    h.users.set("users/u1", { globalScore: 1 });
    await GET(makeRequest(), makeParams("u1"));
    const reg = h.cacheRegistrations.find((r) => r.keyParts.includes("u1"));
    expect(reg).toBeDefined();
    expect(reg!.options.tags).toEqual(["user-scores-u1"]);
    expect(reg!.options.revalidate).toBe(300);
  });

  it("serves repeat requests from cache without re-reading Firestore", async () => {
    h.users.set("users/u1", { globalScore: 1 });
    await GET(makeRequest(), makeParams("u1"));
    await GET(makeRequest(), makeParams("u1"));
    await GET(makeRequest(), makeParams("u1"));
    expect(h.firestoreReads).toBe(1);
  });

  it("caches per user — different users don't share entries", async () => {
    h.users.set("users/u1", { globalScore: 1 });
    h.users.set("users/u2", { globalScore: 2 });
    const b1 = await (await GET(makeRequest(), makeParams("u1"))).json();
    const b2 = await (await GET(makeRequest(), makeParams("u2"))).json();
    expect(b1.globalScore).toBe(1);
    expect(b2.globalScore).toBe(2);
    expect(h.firestoreReads).toBe(2);
  });

  it("a cache bust (as the submit route does via the tag) yields fresh data", async () => {
    h.users.set("users/u1", { globalScore: 100 });
    await GET(makeRequest(), makeParams("u1"));
    // Score improves, submit route calls revalidateTag("user-scores-u1") →
    // simulate the resulting cache eviction for that user's key
    h.users.set("users/u1", { globalScore: 900 });
    for (const key of h.cacheStore.keys()) {
      if (key.includes("u1")) h.cacheStore.delete(key);
    }
    const body = await (await GET(makeRequest(), makeParams("u1"))).json();
    expect(body.globalScore).toBe(900);
  });
});
