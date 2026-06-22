"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "../AuthProvider";
import { auth, db } from "../lib/firebase";
import type { GameId, UserScoresResponse, UserGameBest } from "../lib/scoring/types";

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
  const [scores, setScores] = useState<UserScoresResponse | null>(null);

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
        }
      } catch (e) {
        if (dev) console.error(e);
      }
    })();

    // Load leaderboard scores from the API
    fetch(`/api/scores/user/${user.uid}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: UserScoresResponse | null) => { if (data) setScores(data); })
      .catch(() => {});
  }, [user]);

  if (loading) return <p className="text-muted">Loading…</p>;
  if (!user) return <p className="text-muted">Please log in to view your account.</p>;

  const isGuest = user.isAnonymous;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setStatus(null);
    setSaving(true);
    try {
      const name = username.trim();
      if (auth?.currentUser && name && name !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName: name });
        await refreshUser();
      }
      if (db) {
        await setDoc(
          doc(db, "users", user.uid),
          { username: name, email: email.trim(), country, publicInfo, updatedAt: serverTimestamp() },
          { merge: true }
        );
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
          <input type="text" className="form-control rounded-0" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isGuest} />
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

      {/* ── Scores ──────────────────────────────────────────────────────────── */}
      <hr className="my-4" />
      <h2 className="h5 fw-bold mb-3">Scores</h2>
      <ScoresPanel scores={scores} isGuest={isGuest} />
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

function ScoresPanel({ scores, isGuest }: { scores: UserScoresResponse | null; isGuest: boolean }) {
  if (isGuest) {
    return (
      <p className="text-muted small">Sign in to track your scores across all puzzles.</p>
    );
  }

  if (!scores) {
    return <p className="text-muted small">Loading scores…</p>;
  }

  const entries = Object.entries(scores.gamesBest) as [GameId, UserGameBest][];

  if (entries.length === 0) {
    return <p className="text-muted small">No scores yet — complete a puzzle while signed in to appear here.</p>;
  }

  const MAX_GLOBAL = entries.length * 1000;

  return (
    <div>
      {/* Global score summary */}
      <div className="d-flex align-items-center gap-3 mb-4 p-3 border rounded-0" style={{ background: "var(--bs-body-bg)" }}>
        <div>
          <div className="text-muted small text-uppercase" style={{ letterSpacing: 1 }}>Global Score</div>
          <div className="fw-bold" style={{ fontSize: "1.6rem" }}>{scores.globalScore.toLocaleString()}</div>
        </div>
        <div className="flex-grow-1">
          <div className="progress rounded-0" style={{ height: 8 }}>
            <div
              className="progress-bar bg-info"
              style={{ width: `${Math.min(100, (scores.globalScore / MAX_GLOBAL) * 100).toFixed(1)}%` }}
            />
          </div>
          <div className="text-muted small mt-1">{entries.length} of {Object.keys(GAME_LABELS).length} games played</div>
        </div>
      </div>

      {/* Per-game table */}
      <div className="table-responsive">
        <table className="table table-sm table-bordered mb-0 rounded-0">
          <thead className="table-light">
            <tr>
              <th>Game</th>
              <th>Difficulty</th>
              <th className="text-end">Score</th>
              <th className="text-end">Normalized</th>
            </tr>
          </thead>
          <tbody>
            {entries
              .sort((a, b) => b[1].normalizedScore - a[1].normalizedScore)
              .map(([gameId, best]) => (
                <tr key={gameId}>
                  <td>{GAME_LABELS[gameId] ?? gameId}</td>
                  <td>
                    <span className={`badge bg-${DIFF_COLOR[best.difficulty] ?? "secondary"} rounded-0`}>
                      {best.difficulty}
                    </span>
                  </td>
                  <td className="text-end fw-semibold">{best.score.toLocaleString()}</td>
                  <td className="text-end">
                    <span className="text-info fw-semibold">{best.normalizedScore}</span>
                    <span className="text-muted"> / 1000</span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
