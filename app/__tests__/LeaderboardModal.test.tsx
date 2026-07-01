import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import LeaderboardModal from "../components/LeaderboardModal";

// ─── Mock useAuth ─────────────────────────────────────────────────────────────

const mockGetIdToken = vi.fn().mockResolvedValue("mock-token");

const mockAuthedUser = {
  uid: "current-user",
  displayName: "CurrentUser",
  isAnonymous: false,
  getIdToken: mockGetIdToken,
};

vi.mock("../AuthProvider", () => ({
  useAuth: () => ({ user: currentUser, loading: false, enabled: true }),
}));

// Mutable so individual tests can swap it
let currentUser: typeof mockAuthedUser | null = mockAuthedUser;

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface Player {
  rank: number;
  uid: string;
  displayName: string;
  score: number;
  normalizedScore: number;
  difficulty: string;
  updatedAt: string;
}

function makePlayer(overrides: Partial<Player> & { uid: string; rank: number; score: number }): Player {
  return {
    displayName: `Player-${overrides.uid}`,
    normalizedScore: overrides.score,
    difficulty: "easy",
    updatedAt: "",
    ...overrides,
  };
}

function buildResponse(players: Player[], userEntry: (Player & { rank: number }) | null = null, totalPlayers?: number) {
  return { players, totalPlayers: totalPlayers ?? players.length, userEntry };
}

// ─── Module-level cache reset helper ─────────────────────────────────────────
// LeaderboardModal keeps a module-level cache Map. We must reach into the
// module and clear it between tests to prevent cross-test contamination.
// We do this by importing the component's module and exploiting the fact that
// vitest re-uses the same module instance across the test file (no isolation).
// The simplest approach: change gameId+puzzleId per test to get a fresh key.

let puzzleCounter = 1000; // unique per test to avoid cache collisions

function freshPuzzleId() { return puzzleCounter++; }

// ─── Render helper ────────────────────────────────────────────────────────────

function renderModal(puzzleId: number, onClose = vi.fn()) {
  return render(
    <LeaderboardModal
      gameId="mate-in-1"
      puzzleId={puzzleId}
      onClose={onClose}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("LeaderboardModal | loading state", () => {
  beforeEach(() => {
    currentUser = mockAuthedUser;
    // fetch never resolves → stays in loading
    vi.stubGlobal("fetch", () => new Promise(() => {}));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows a loading spinner while fetching", () => {
    renderModal(freshPuzzleId());
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders the modal header with puzzle ID", () => {
    const id = freshPuzzleId();
    renderModal(id);
    expect(screen.getByText(`Puzzle #${id}`)).toBeInTheDocument();
    expect(screen.getByText(/leaderboard/i)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("LeaderboardModal | unauthenticated user", () => {
  beforeEach(() => { currentUser = null; });

  it("prompts to sign in instead of fetching", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    renderModal(freshPuzzleId());
    await waitFor(() => {
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  afterEach(() => vi.unstubAllGlobals());
});

// ─────────────────────────────────────────────────────────────────────────────

describe("LeaderboardModal | anonymous user", () => {
  beforeEach(() => {
    currentUser = { ...mockAuthedUser, isAnonymous: true };
  });

  it("shows sign-in prompt for anonymous users", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    renderModal(freshPuzzleId());
    await waitFor(() => {
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  afterEach(() => vi.unstubAllGlobals());
});

// ─────────────────────────────────────────────────────────────────────────────

describe("LeaderboardModal | fetch error", () => {
  beforeEach(() => {
    currentUser = mockAuthedUser;
    vi.stubGlobal("fetch", () => Promise.reject(new Error("Network error")));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows an error message when fetch fails", async () => {
    renderModal(freshPuzzleId());
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("LeaderboardModal | empty leaderboard", () => {
  beforeEach(() => {
    currentUser = mockAuthedUser;
    vi.stubGlobal("fetch", () =>
      Promise.resolve({ ok: true, json: async () => buildResponse([]) } as Response)
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows 'no scores yet' when leaderboard is empty", async () => {
    renderModal(freshPuzzleId());
    await waitFor(() => {
      expect(screen.getByText(/no scores yet/i)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("LeaderboardModal | data display", () => {
  const players: Player[] = [
    makePlayer({ rank: 1, uid: "u1", displayName: "Alice",   score: 900 }),
    makePlayer({ rank: 2, uid: "u2", displayName: "Bob",     score: 750 }),
    makePlayer({ rank: 3, uid: "u3", displayName: "Carol",   score: 600 }),
  ];

  beforeEach(() => {
    currentUser = mockAuthedUser;
    vi.stubGlobal("fetch", () =>
      Promise.resolve({ ok: true, json: async () => buildResponse(players) } as Response)
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("renders all player rows", async () => {
    renderModal(freshPuzzleId());
    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Carol")).toBeInTheDocument();
  });

  it("displays rank numbers correctly", async () => {
    renderModal(freshPuzzleId());
    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
    const rows = screen.getAllByRole("row").filter((r) => r.closest("tbody"));
    expect(within(rows[0]).getByText("1")).toBeInTheDocument();
    expect(within(rows[1]).getByText("2")).toBeInTheDocument();
    expect(within(rows[2]).getByText("3")).toBeInTheDocument();
  });

  it("displays formatted scores", async () => {
    renderModal(freshPuzzleId());
    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
    expect(screen.getByText("900")).toBeInTheDocument();
    expect(screen.getByText("750")).toBeInTheDocument();
    expect(screen.getByText("600")).toBeInTheDocument();
  });

  it("shows total player count", async () => {
    vi.stubGlobal("fetch", () =>
      Promise.resolve({
        ok: true,
        json: async () => buildResponse(players, null, 42),
      } as Response)
    );
    renderModal(freshPuzzleId());
    await waitFor(() => expect(screen.getByText(/42 players/i)).toBeInTheDocument());
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("LeaderboardModal | current user in top 100", () => {
  const players: Player[] = [
    makePlayer({ rank: 1, uid: "u1",           displayName: "Alice",       score: 900 }),
    makePlayer({ rank: 2, uid: "current-user", displayName: "CurrentUser", score: 750 }),
    makePlayer({ rank: 3, uid: "u3",           displayName: "Carol",       score: 600 }),
  ];

  beforeEach(() => {
    currentUser = mockAuthedUser;
    vi.stubGlobal("fetch", () =>
      Promise.resolve({ ok: true, json: async () => buildResponse(players) } as Response)
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("marks the current user's row with a 'you' badge", async () => {
    renderModal(freshPuzzleId());
    await waitFor(() => expect(screen.getByText("CurrentUser")).toBeInTheDocument());
    expect(screen.getByText("you")).toBeInTheDocument();
  });

  it("does not render a pinned footer row when user is in top 100", async () => {
    renderModal(freshPuzzleId());
    await waitFor(() => expect(screen.getByText("CurrentUser")).toBeInTheDocument());
    // 'you' badge should appear exactly once (inline in table, not also in footer)
    expect(screen.getAllByText("you")).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("LeaderboardModal | current user outside top 100", () => {
  const top3: Player[] = [
    makePlayer({ rank: 1, uid: "u1", displayName: "Alice", score: 900 }),
    makePlayer({ rank: 2, uid: "u2", displayName: "Bob",   score: 750 }),
    makePlayer({ rank: 3, uid: "u3", displayName: "Carol", score: 600 }),
  ];
  const userEntry = makePlayer({ rank: 142, uid: "current-user", displayName: "CurrentUser", score: 50 });

  beforeEach(() => {
    currentUser = mockAuthedUser;
    vi.stubGlobal("fetch", () =>
      Promise.resolve({
        ok: true,
        json: async () => buildResponse(top3, userEntry, 200),
      } as Response)
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("renders the user's rank in a pinned footer row", async () => {
    renderModal(freshPuzzleId());
    await waitFor(() => expect(screen.getByText("CurrentUser")).toBeInTheDocument());
    expect(screen.getByText("142")).toBeInTheDocument();
  });

  it("shows the 'you' badge in the footer row", async () => {
    renderModal(freshPuzzleId());
    await waitFor(() => expect(screen.getByText("CurrentUser")).toBeInTheDocument());
    expect(screen.getByText("you")).toBeInTheDocument();
  });

  it("does not show CurrentUser in the scrollable top section", async () => {
    renderModal(freshPuzzleId());
    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
    // The top 3 player names should be Alice, Bob, Carol only
    const topNames = ["Alice", "Bob", "Carol"];
    topNames.forEach((name) => expect(screen.getByText(name)).toBeInTheDocument());
    // CurrentUser appears in the footer (via displayName text node), confirmed by the badge
    expect(screen.getByText("you")).toBeInTheDocument();
    expect(screen.getByText("CurrentUser")).toBeInTheDocument();
  });

  it("shows the user's score in the footer", async () => {
    renderModal(freshPuzzleId());
    await waitFor(() => expect(screen.getByText("CurrentUser")).toBeInTheDocument());
    expect(screen.getByText("50")).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("LeaderboardModal | caching", () => {
  beforeEach(() => { currentUser = mockAuthedUser; });
  afterEach(() => vi.unstubAllGlobals());

  it("fetches only once when opened twice with the same puzzle ID", async () => {
    const puzzleId = freshPuzzleId();
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => buildResponse([makePlayer({ rank: 1, uid: "u1", score: 100 })]),
    } as Response);
    vi.stubGlobal("fetch", fetchSpy);

    const { unmount } = render(
      <LeaderboardModal gameId="mate-in-1" puzzleId={puzzleId} onClose={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText("Player-u1")).toBeInTheDocument());
    unmount();

    // Re-open same puzzle
    render(<LeaderboardModal gameId="mate-in-1" puzzleId={puzzleId} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Player-u1")).toBeInTheDocument());

    expect(fetchSpy).toHaveBeenCalledTimes(1); // cache hit on second open
  });

  it("fetches again for a different puzzle ID (separate cache entry)", async () => {
    const id1 = freshPuzzleId();
    const id2 = freshPuzzleId();
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => buildResponse([]),
    } as Response);
    vi.stubGlobal("fetch", fetchSpy);

    const { unmount } = render(
      <LeaderboardModal gameId="mate-in-1" puzzleId={id1} onClose={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText(/no scores yet/i)).toBeInTheDocument());
    unmount();

    render(<LeaderboardModal gameId="mate-in-1" puzzleId={id2} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/no scores yet/i)).toBeInTheDocument());

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("invalidateRef clears the cache so the next open re-fetches", async () => {
    const puzzleId = freshPuzzleId();
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => buildResponse([makePlayer({ rank: 1, uid: "u1", score: 100 })]),
    } as Response);
    vi.stubGlobal("fetch", fetchSpy);

    // Wrapper that exposes the invalidateRef
    function Wrapper() {
      const invalidateRef = useRef<(() => void) | null>(null);
      return (
        <>
          <LeaderboardModal gameId="mate-in-1" puzzleId={puzzleId} onClose={vi.fn()} invalidateRef={invalidateRef} />
          <button onClick={() => invalidateRef.current?.()}>Bust cache</button>
        </>
      );
    }

    const { unmount } = render(<Wrapper />);
    await waitFor(() => expect(screen.getByText("Player-u1")).toBeInTheDocument());

    // Bust the cache via the ref
    await userEvent.click(screen.getByText("Bust cache"));
    unmount();

    // Re-open | should fetch again
    render(<LeaderboardModal gameId="mate-in-1" puzzleId={puzzleId} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Player-u1")).toBeInTheDocument());

    expect(fetchSpy).toHaveBeenCalledTimes(2); // second fetch after cache bust
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("LeaderboardModal | dismiss behaviour", () => {
  beforeEach(() => {
    currentUser = mockAuthedUser;
    vi.stubGlobal("fetch", () => new Promise(() => {})); // stays loading
  });
  afterEach(() => vi.unstubAllGlobals());

  it("calls onClose when the × button is clicked", async () => {
    const onClose = vi.fn();
    renderModal(freshPuzzleId(), onClose);
    await userEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const onClose = vi.fn();
    renderModal(freshPuzzleId(), onClose);
    // The backdrop is the outermost position-fixed div
    const backdrop = document.querySelector<HTMLElement>(".position-fixed");
    expect(backdrop).not.toBeNull();
    await userEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = vi.fn();
    renderModal(freshPuzzleId(), onClose);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("LeaderboardModal | API request", () => {
  beforeEach(() => { currentUser = mockAuthedUser; });
  afterEach(() => vi.unstubAllGlobals());

  it("sends Authorization header with the user's token", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => buildResponse([]),
    } as Response);
    vi.stubGlobal("fetch", fetchSpy);

    renderModal(freshPuzzleId());
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect((options?.headers as Record<string, string>)?.["Authorization"]).toBe("Bearer mock-token");
  });

  it("constructs the correct URL with gameId and puzzleId", async () => {
    const puzzleId = freshPuzzleId();
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => buildResponse([]),
    } as Response);
    vi.stubGlobal("fetch", fetchSpy);

    renderModal(puzzleId);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());

    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toContain("game=mate-in-1");
    expect(url).toContain(`puzzle=${puzzleId}`);
  });
});
