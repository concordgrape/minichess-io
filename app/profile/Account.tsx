"use client";

import { Fragment, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "../AuthProvider";
import { auth, db } from "../lib/firebase";
import type { GameId, UserScoresResponse, Difficulty } from "../lib/scoring/types";

const COUNTRIES = [
  "Argentina", "Australia", "Austria", "Belgium", "Brazil", "Bulgaria", "Canada",
  "Chile", "China", "Colombia", "Croatia", "Czech Republic", "Denmark", "Egypt",
  "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Iceland",
  "India", "Indonesia", "Ireland", "Israel", "Italy", "Japan", "Latvia",
  "Lithuania", "Mexico", "Netherlands", "New Zealand", "Norway", "Peru",
  "Philippines", "Poland", "Portugal", "Romania", "Russia", "Saudi Arabia",
  "Serbia", "Singapore", "Slovakia", "Slovenia", "South Africa", "South Korea",
  "Spain", "Sweden", "Switzerland", "Turkey", "Ukraine", "United Arab Emirates",
  "United Kingdom", "United States", "Vietnam",
];

const dev = process.env.NODE_ENV !== "production";

export default function Account() {
  const { user, loading, refreshUser, openAuth } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [publicInfo, setPublicInfo] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [scores, setScores] = useState<UserScoresResponse | null | "error">(null);
  const [completionCounts, setCompletionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    setUsername(user.displayName || "");
    setEmail(user.email || "");
    (async () => {
      if (!db) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          if (d.username) setUsername(d.username);
          if (d.email) setEmail(d.email);
          setCountry(d.country || "");
          setPublicInfo(d.publicInfo || "");
          // Count completed puzzles per game from puzzleProgress
          const progress = d.puzzleProgress as Record<string, { completed?: number[] }> | undefined;
          if (progress) {
            const counts: Record<string, number> = {};
            for (const [gameId, p] of Object.entries(progress)) {
              counts[gameId] = p.completed?.length ?? 0;
            }
            setCompletionCounts(counts);
          }
        }
      } catch (e) {
        if (dev) console.error(e);
      }
    })();

    // Load leaderboard scores from the API
    fetch(`/api/scores/user/${user.uid}`)
      .then((r) => {
        if (r.status === 404) return { globalScore: 0, gamesBest: {} } as UserScoresResponse;
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<UserScoresResponse>;
      })
      .then((data) => setScores(data))
      .catch(() => setScores("error"));
  }, [user]);

  if (loading) return <p className="text-muted">Loading…</p>;
  if (!user) return <p className="text-muted">Please log in to view your account.</p>;

  const isGuest = user.isAnonymous;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setStatus(null);

    // Client-side pre-validation for immediate feedback
    const name = username.trim();
    if (name && /\s/.test(name)) {
      setStatus({ type: "err", msg: "Username cannot contain spaces." });
      return;
    }
    if (name && (name.length < 2 || name.length > 30)) {
      setStatus({ type: "err", msg: "Username must be 2–30 characters." });
      return;
    }

    setSaving(true);
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) throw new Error("not authenticated");

      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: name, email: email.trim(), country, publicInfo }),
      });
      const data = await res.json() as { error?: string; message?: string; saved?: boolean };

      if (!res.ok) {
        setStatus({ type: "err", msg: data.message ?? "Couldn't update your profile. Please try again." });
        return;
      }

      // Update Firebase Auth display name client-side (requires client SDK)
      if (auth?.currentUser && name && name !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName: name });
        await refreshUser();
      }

      setStatus({ type: "ok", msg: "Profile updated." });
    } catch (e) {
      if (dev) console.error(e);
      setStatus({ type: "err", msg: "Couldn't update your profile. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!auth || !user?.email) return;
    setStatus(null);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setStatus({ type: "ok", msg: `Password reset email sent to ${user.email}.` });
    } catch (e) {
      if (dev) console.error(e);
      setStatus({ type: "err", msg: "Couldn't send a password reset email. Please try again." });
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 720 }}>
      {isGuest && (
        <div className="alert alert-warning rounded-0 d-flex flex-wrap align-items-center gap-2" role="alert">
          <span className="me-auto">You&apos;re playing as a guest. Create an account or sign in to edit your profile and keep your progress.</span>
          <button type="button" className="btn btn-sm rounded-0 text-white" style={{ backgroundColor: "#5cb85c", borderColor: "#4cae4c" }} onClick={() => openAuth("signup")}>Create an account</button>
          <button type="button" className="btn btn-sm btn-info text-white rounded-0" onClick={() => openAuth("login")}>Sign in</button>
        </div>
      )}
      {status && (
        <div className={`alert ${status.type === "ok" ? "alert-success" : "alert-danger"} rounded-0 py-2 px-3`} role="alert">
          {status.msg}
        </div>
      )}

      <div className="row mb-3 align-items-center">
        <label className="col-sm-3 col-form-label fw-bold text-sm-end">Username</label>
        <div className="col-sm-9">
          <input type="text" className="form-control rounded-0" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} disabled={isGuest} />
        </div>
      </div>

      <div className="row mb-3 align-items-center">
        <label className="col-sm-3 col-form-label fw-bold text-sm-end">Email</label>
        <div className="col-sm-9">
          <input type="email" className="form-control rounded-0" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isGuest} />
        </div>
      </div>

      <div className="row mb-3 align-items-center">
        <label className="col-sm-3 col-form-label fw-bold text-sm-end">Country</label>
        <div className="col-sm-9">
          <select className="form-select rounded-0" value={country} onChange={(e) => setCountry(e.target.value)} disabled={isGuest}>
            <option value="">Select a country…</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="row mb-3 align-items-center">
        <label className="col-sm-3 col-form-label fw-bold text-sm-end">Password</label>
        <div className="col-sm-9">
          <button type="button" className="btn btn-outline-secondary rounded-0 d-inline-flex align-items-center gap-2" onClick={handleChangePassword} disabled={isGuest}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Change password
          </button>
        </div>
      </div>

      <div className="row mb-3">
        <label className="col-sm-3 col-form-label fw-bold text-sm-end">Public information</label>
        <div className="col-sm-9">
          <textarea className="form-control rounded-0" rows={6} value={publicInfo} onChange={(e) => setPublicInfo(e.target.value)} disabled={isGuest} />
        </div>
      </div>

      <div className="row">
        <div className="col-sm-9 offset-sm-3">
          <button type="submit" className="btn rounded-0 text-white" style={{ backgroundColor: "#5cb85c", borderColor: "#4cae4c" }} disabled={saving || isGuest}>
            {saving ? "Updating…" : "Update profile"}
          </button>
        </div>
      </div>

      {/* ── Badges ──────────────────────────────────────────────────────────── */}
      <hr className="my-4" />
      <h2 className="h5 fw-bold mb-3">Badges</h2>
      <BadgesPanel creationTime={user.metadata.creationTime} isGuest={isGuest} />
      <GameBadgesPanel completionCounts={completionCounts} isGuest={isGuest} />

      {/* ── Scores ──────────────────────────────────────────────────────────── */}
      <hr className="my-4" />
      <h2 className="h5 fw-bold mb-3">Scores</h2>
      <ScoresPanel scores={scores === "error" ? null : scores} scoresError={scores === "error"} isGuest={isGuest} />
    </form>
  );
}

const GAME_LABELS: Record<GameId, string> = {
  "mate-in-1": "Mate in 1",
  "mate-in-2": "Mate in 2",
  "mate-in-3": "Mate in 3",
  "check": "Check Puzzles",
  "smothered": "Smothered Mate",
  "takes": "Takes Puzzles",
  "solitaire": "Chain Capture",
  "chess-solitaire": "Chess Solitaire",
  "queen-vs-pawn": "Queen vs Pawn",
  "king-and-pawn": "King & Pawn",
  "rook-endgame": "Rook Endgame",
  "zugzwang": "Zugzwang",
  "survival": "Survival",
};

const DIFF_COLOR: Record<string, string> = {
  easy: "success", medium: "warning", hard: "danger",
};

// ── Badge SVGs ────────────────────────────────────────────────────────────────

function SeedlingIcon() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#1a6b2e" />
      <path d="M24 36V22" stroke="#a8e6b0" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 26c0 0-6-4-6-10 0 0 6 0 6 10z" fill="#4caf72" />
      <path d="M24 22c0 0 5-3 5-9 0 0-5 1-5 9z" fill="#6dd48a" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#8b2500" />
      {/* Outer flame */}
      <path d="M24 9 C24 9 31 17 30 23 C32 20 32 16 30 13 C34 18 35 25 32 31 C30 35 27 37 24 37 C21 37 18 35 16 31 C13 25 14 18 18 13 C16 16 16 20 18 23 C17 17 24 9 24 9 Z" fill="#ff6b00" />
      {/* Inner bright core */}
      <path d="M24 20 C24 20 28 25 27 29 C26 32 25 33 24 33 C23 33 22 32 21 29 C20 25 24 20 24 20 Z" fill="#ffcc00" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#5a3e00" />
      <polygon points="26,10 14,27 23,27 22,38 34,21 25,21" fill="#ffd700" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#7a5c00" />
      <path d="M17 13h14v10c0 5-3 8-7 8s-7-3-7-8V13z" fill="#ffd700" />
      <path d="M17 16c-3 0-5 2-5 5s2 4 5 4" stroke="#ffd700" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M31 16c3 0 5 2 5 5s-2 4-5 4" stroke="#ffd700" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="21" y="31" width="6" height="4" fill="#ffd700" />
      <rect x="17" y="35" width="14" height="2.5" rx="1" fill="#ffd700" />
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#003366" />
      <polygon points="24,10 34,20 24,38 14,20" fill="#a8d8f0" />
      <polygon points="24,10 34,20 24,22 14,20" fill="#e0f4ff" />
      <polygon points="14,20 24,22 24,38" fill="#5bafd6" />
      <polygon points="34,20 24,22 24,38" fill="#7ec8e3" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#4a0080" />
      <path d="M10,36 L10,22 L16,29 L24,13 L32,29 L38,22 L38,36 Z" fill="#ffd700" />
      <circle cx="13" cy="22" r="2.5" fill="#fff" opacity="0.9" />
      <circle cx="24" cy="13" r="2.5" fill="#fff" opacity="0.9" />
      <circle cx="35" cy="22" r="2.5" fill="#fff" opacity="0.9" />
    </svg>
  );
}

const LONGEVITY_BADGES: { label: string; Icon: () => React.JSX.Element; days: number; description: string }[] = [
  { label: "First Day",  Icon: SeedlingIcon, days: 1,    description: "Played for 1 day" },
  { label: "One Week",   Icon: FlameIcon,    days: 7,    description: "Played for a week" },
  { label: "One Month",  Icon: BoltIcon,     days: 30,   description: "Played for a month" },
  { label: "One Year",   Icon: TrophyIcon,   days: 365,  description: "Played for a year" },
  { label: "Five Years", Icon: DiamondIcon,  days: 1825, description: "Played for 5 years" },
  { label: "Decade",     Icon: CrownIcon,    days: 3650, description: "Played for 10+ years" },
];

function BadgesPanel({ creationTime, isGuest }: { creationTime?: string; isGuest: boolean }) {
  if (isGuest) return <p className="text-muted small">Sign in to earn badges.</p>;
  if (!creationTime) return <p className="text-muted small">No account data available.</p>;

  const daysSinceJoined = Math.floor((Date.now() - new Date(creationTime).getTime()) / 86_400_000);

  return (
    <div className="d-flex flex-wrap gap-3">
      {LONGEVITY_BADGES.map(({ label, Icon, days, description }) => {
        const earned = daysSinceJoined >= days;
        return (
          <div key={label} title={description} style={{ width: 80, textAlign: "center", opacity: earned ? 1 : 0.2, filter: earned ? "none" : "grayscale(1)" }}>
            <Icon />
            <div className="fw-semibold mt-1" style={{ fontSize: 11 }}>{label}</div>
            <div className="text-muted" style={{ fontSize: 10 }}>{description}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Game completion badges ─────────────────────────────────────────────────────

const COMPLETION_MILESTONES: { count: number; subtitle: string }[] = [
  { count: 1,    subtitle: "First Solve" },
  { count: 5,    subtitle: "Getting Started" },
  { count: 10,   subtitle: "Warming Up" },
  { count: 20,   subtitle: "Regular" },
  { count: 50,   subtitle: "Dedicated" },
  { count: 100,  subtitle: "Century" },
  { count: 500,  subtitle: "Expert" },
  { count: 1000, subtitle: "Master" },
];

// Bronze circle → silver circle → gold circle → bronze star → silver star → gold star → gem → crown
const MILESTONE_COLORS = [
  { bg: "#a0522d", rim: "#cd7f32", label: "#fff" },  // 1   bronze
  { bg: "#708090", rim: "#c0c0c0", label: "#fff" },  // 5   silver
  { bg: "#b8860b", rim: "#ffd700", label: "#fff" },  // 10  gold
  { bg: "#7b3300", rim: "#e8824a", label: "#fff" },  // 20  bronze star
  { bg: "#4a5568", rim: "#a0aec0", label: "#fff" },  // 50  silver star
  { bg: "#744700", rim: "#f6c000", label: "#fff" },  // 100 gold star
  { bg: "#1a3a6b", rim: "#63b3ed", label: "#fff" },  // 500 gem
  { bg: "#3d006e", rim: "#b794f4", label: "#fff" },  // 1k  crown
];

function MilestoneCircle({ milestone, subtitle, index, earned }: { milestone: number; subtitle: string; index: number; earned: boolean }) {
  const { bg, rim, label } = MILESTONE_COLORS[index];
  const isStar = index >= 3 && index <= 5;
  const isGem = index === 6;
  const isCrown = index === 7;
  const displayLabel = milestone >= 1000 ? "1k" : String(milestone);

  // 5-pointed star, outer r=16, inner r=6.5, centered at 24,24
  const starPath = "M24,8 L28,19 L39,19 L30,26 L33,37 L24,31 L15,37 L18,26 L9,19 L20,19 Z";
  // Crown shape: three pointed peaks with a base band
  const crownPath = "M10,34 L10,22 L16,28 L24,14 L32,28 L38,22 L38,34 Z";

  return (
    <div
      title={earned ? `Completed ${milestone} puzzle${milestone > 1 ? "s" : ""}` : `Complete ${milestone} puzzles to unlock`}
      style={{ width: 56, textAlign: "center", opacity: earned ? 1 : 0.18, filter: earned ? "none" : "grayscale(1)" }}
    >
      <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
        <circle cx="24" cy="24" r="22" fill={bg} />
        {isStar ? (
          <>
            <path d={starPath} fill={rim} />
          </>
        ) : isGem ? (
          <>
            <polygon points="10,22 24,8 38,22 24,40" fill={rim} />
            <polygon points="10,22 24,8 38,22 24,22" fill="#a8d8f0" opacity="0.5" />
            <polygon points="10,22 24,22 24,40" fill={rim} opacity="0.7" />
          </>
        ) : isCrown ? (
          <>
            <path d={crownPath} fill={rim} />
            <circle cx="13" cy="22" r="2.5" fill="#fff" opacity="0.9" />
            <circle cx="24" cy="14" r="2.5" fill="#fff" opacity="0.9" />
            <circle cx="35" cy="22" r="2.5" fill="#fff" opacity="0.9" />
          </>
        ) : (
          <circle cx="24" cy="24" r="13" fill={rim} />
        )}
        <text x="24" y={isStar ? "30" : isCrown ? "32" : "29"} textAnchor="middle" fill={label} fontSize={displayLabel.length > 2 ? "9" : "11"} fontWeight="bold" fontFamily="sans-serif">
          {displayLabel}
        </text>
      </svg>
      <div className="fw-semibold mt-1" style={{ fontSize: 10 }}>{displayLabel}</div>
      <div className="text-muted" style={{ fontSize: 10 }}>{subtitle}</div>
    </div>
  );
}

function GameBadgesPanel({ completionCounts, isGuest }: { completionCounts: Record<string, number>; isGuest: boolean }) {
  if (isGuest) return null;

  const games = Object.keys(GAME_LABELS) as GameId[];
  const played = games.filter((g) => (completionCounts[g] ?? 0) > 0);
  if (played.length === 0) return null;

  return (
    <div className="mt-4">
      {played.map((gameId) => {
        const count = completionCounts[gameId] ?? 0;
        return (
          <div key={gameId} className="mb-4">
            <div className="fw-semibold small mb-2">{GAME_LABELS[gameId]} <span className="text-muted fw-normal">({count} completed)</span></div>
            <div className="d-flex flex-wrap gap-2">
              {COMPLETION_MILESTONES.map(({ count: threshold, subtitle }, i) => (
                <MilestoneCircle key={threshold} milestone={threshold} subtitle={subtitle} index={i} earned={count >= threshold} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

function ScoresPanel({ scores, scoresError, isGuest }: { scores: UserScoresResponse | null; scoresError?: boolean; isGuest: boolean }) {
  const [expanded, setExpanded] = useState<Set<GameId>>(new Set());

  if (isGuest) {
    return (
      <p className="text-muted small">Sign in to track your scores across all puzzles.</p>
    );
  }

  if (scoresError) {
    return <p className="text-muted small">Couldn&apos;t load scores. Please refresh the page.</p>;
  }

  if (!scores) {
    return <p className="text-muted small">Loading scores…</p>;
  }

  const allGames = Object.keys(GAME_LABELS) as GameId[];

  function toggleExpanded(gameId: GameId) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) next.delete(gameId);
      else next.add(gameId);
      return next;
    });
  }

  return (
    <div>
      <div className="table-responsive">
        <table className="table table-sm table-bordered mb-0 rounded-0">
          <thead className="table-light">
            <tr>
              <th>Game</th>
              <th>Best difficulty</th>
              <th className="text-end">Score</th>
              <th className="text-end">Normalized</th>
            </tr>
          </thead>
          <tbody>
            {allGames.map((gameId) => {
              const best = scores.gamesBest[gameId];
              const diffCounts = scores.difficultyCompletions?.[gameId] ?? {};
              const playedDiffs = DIFFICULTIES.filter((d) => (diffCounts[d] ?? 0) > 0);
              const isExpanded = expanded.has(gameId);
              const maxCount = Math.max(...playedDiffs.map((d) => diffCounts[d] ?? 0), 1);

              return (
                <Fragment key={gameId}>
                  <tr
                    style={playedDiffs.length > 1 ? { cursor: "pointer" } : undefined}
                    onClick={playedDiffs.length > 1 ? () => toggleExpanded(gameId) : undefined}
                  >
                    <td>
                      {playedDiffs.length > 1 && (
                        <span className="me-1 text-muted" style={{ fontSize: "0.7em" }}>
                          {isExpanded ? "▼" : "▶"}
                        </span>
                      )}
                      {GAME_LABELS[gameId]}
                    </td>
                    <td>
                      {best ? (
                        <span className={`badge bg-${DIFF_COLOR[best.difficulty] ?? "secondary"} rounded-0`}>
                          {best.difficulty}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="text-end fw-semibold">
                      {best ? best.score.toLocaleString() : <span className="text-muted">—</span>}
                    </td>
                    <td className="text-end">
                      {best ? (
                        <>
                          <span className="text-info fw-semibold">{best.normalizedScore}</span>
                          <span className="text-muted"> / 1000</span>
                        </>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                  {isExpanded && playedDiffs.length > 1 && (
                    <tr className="table-light">
                      <td colSpan={4} className="py-2 px-3">
                        <div className="d-flex flex-column gap-1" style={{ fontSize: "0.82em" }}>
                          {DIFFICULTIES.map((diff) => {
                            const count = diffCounts[diff] ?? 0;
                            if (count === 0) return null;
                            const pct = Math.round((count / maxCount) * 100);
                            return (
                              <div key={diff} className="d-flex align-items-center gap-2">
                                <span
                                  className={`badge bg-${DIFF_COLOR[diff]} rounded-0`}
                                  style={{ width: "4.5rem", textAlign: "center" }}
                                >
                                  {diff}
                                </span>
                                <div
                                  className="flex-grow-1 rounded-0"
                                  style={{ height: 8, background: "var(--bs-secondary-bg)" }}
                                >
                                  <div
                                    className={`bg-${DIFF_COLOR[diff]} h-100`}
                                    style={{ width: `${pct}%`, transition: "width 0.3s ease" }}
                                  />
                                </div>
                                <span className="text-muted" style={{ minWidth: "2.5rem", textAlign: "right" }}>
                                  {count} {count === 1 ? "solve" : "solves"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
