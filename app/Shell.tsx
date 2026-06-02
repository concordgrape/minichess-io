"use client";

import { useEffect, useState } from "react";
import { totalScore } from "./lib/scores";

const SidebarLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
  <>
    <div className="mb-3">
      <a href="/chess" className="sidebar-link" onClick={onNavigate}>Play Chess</a>
      <a href="/minichess" className="sidebar-link" onClick={onNavigate}>Mini Chess</a>
      <a href="/takes" className="sidebar-link" onClick={onNavigate}>Takes</a>
      <a href="/check" className="sidebar-link" onClick={onNavigate}>Check</a>
      <a href="/smothered" className="sidebar-link" onClick={onNavigate}>Smothered</a>
      <a href="/chess-solitaire" className="sidebar-link" onClick={onNavigate}>Chess Solitaire</a>
      <a href="/solitaire" className="sidebar-link" onClick={onNavigate}>Chain Capture</a>
      <a href="/survival" className="sidebar-link" onClick={onNavigate}>Survival</a>
      <a href="#" className="sidebar-link" onClick={onNavigate}>No guessing mode</a>
      <a href="#" className="sidebar-link" onClick={onNavigate}>Multiplayer</a>
      <a href="#" className="sidebar-link" onClick={onNavigate}>Ranking</a>
      <a href="#" className="sidebar-link" onClick={onNavigate}>My games</a>
    </div>
    <div className="mb-3">
      <a href="#" className="sidebar-link" onClick={onNavigate}>Best players</a>
      <a href="#" className="sidebar-link" onClick={onNavigate}>Season leaders</a>
    </div>
    <div className="mb-3">
      <a href="#" className="sidebar-link" onClick={onNavigate}>Quests (0)</a>
      <a href="#" className="sidebar-link" onClick={onNavigate}>Arena</a>
      <a href="#" className="sidebar-link" onClick={onNavigate}>Equipment</a>
      <a href="#" className="sidebar-link" onClick={onNavigate}>Marketplace</a>
      <a href="#" className="sidebar-link" onClick={onNavigate}>Events</a>
      <a href="#" className="sidebar-link" onClick={onNavigate}>Championship</a>
    </div>
    <div className="mb-3">
      <a href="#" className="sidebar-link" onClick={onNavigate}>Players online (1430)</a>
      <a href="#" className="sidebar-link" onClick={onNavigate}>News</a>
      <a href="#" className="sidebar-link" onClick={onNavigate}>Statistics</a>
      <a href="#" className="sidebar-link" onClick={onNavigate}>My profile</a>
    </div>
    <div>
      <a href="#" className="sidebar-link" onClick={onNavigate}>Chat (100+)</a>
    </div>
  </>
);

export default function Shell({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    setScore(totalScore());
    const handler = () => setScore(totalScore());
    window.addEventListener("minichess_score_update", handler);
    return () => window.removeEventListener("minichess_score_update", handler);
  }, []);

  // Sync from localStorage after mount (avoids SSR/client hydration mismatch)
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored) setDark(stored === "dark");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  // Close drawer on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const drawer = document.getElementById("mobile-drawer");
      if (drawer && !drawer.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <nav className="navbar border-bottom">
        <div className="container-fluid px-0">
          <div
            style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}
            className="d-flex align-items-center justify-content-between w-100"
          >
            {/* Left: hamburger (mobile) + brand */}
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-outline-secondary rounded-0 d-lg-none"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Toggle menu"
              >
                ☰
              </button>
              <a className="navbar-brand d-flex align-items-center fw-bold mb-0" href="/">
                <span
                  className="me-2 bg-secondary d-inline-flex align-items-center justify-content-center text-white"
                  style={{ width: 32, height: 32, fontSize: 14 }}
                >
                  ♟
                </span>
                MiniChess.io
              </a>
            </div>

            {/* Right: action buttons */}
            <div className="d-flex align-items-center gap-2">
              <button className="btn rounded-0" style={{ color: "#fff", backgroundColor: "#5cb85c", borderColor: "#4cae4c" }}>Sign up</button>
              <button className="btn btn-info text-white rounded-0">Log in</button>
              <button
                className="btn btn-outline-secondary rounded-0"
                onClick={() => setDark((d) => !d)}
                title={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {dark ? "☀️" : "🌙"}
              </button>
              {score > 0 && (
                <span className="badge rounded-0 text-bg-warning" style={{ fontSize: 13 }}>
                  ★ {score.toLocaleString()}
                </span>
              )}
              <span className="text-muted small d-none d-sm-inline">🇺🇸 English ▾</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer backdrop */}
      {menuOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1040,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        />
      )}

      {/* Mobile drawer */}
      <div
        id="mobile-drawer"
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 1050,
          width: 260,
          padding: "20px 24px",
          overflowY: "auto",
          transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
          backgroundColor: "var(--bs-body-bg)",
          borderRight: "1px solid var(--bs-border-color)",
        }}
      >
        <div className="d-flex align-items-center justify-content-between mb-4">
          <span className="fw-bold">Menu</span>
          <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={() => setMenuOpen(false)}>✕</button>
        </div>
        <SidebarLinks onNavigate={() => setMenuOpen(false)} />
      </div>

      {/* Main layout */}
      <div className="container-fluid px-0">
        <div style={{ maxWidth: 1100, margin: "16px auto" }}>
          <div className="row g-0 border">
            {/* Desktop sidebar */}
            <div className="col-auto border-end d-none d-lg-block" style={{ minWidth: 200, padding: "20px 24px" }}>
              <SidebarLinks />
            </div>

            {/* Page content */}
            <div className="col p-4">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
