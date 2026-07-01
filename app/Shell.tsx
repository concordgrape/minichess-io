"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { totalScore } from "./lib/scores";
import UserMenu from "./UserMenu";
import { useAuth } from "./AuthProvider";
import Footer from "./components/Footer";
import { useLocale } from "@/app/i18n/LocaleProvider";
import { type LocaleKey } from "@/app/i18n/index";

const LOCALE_OPTIONS: { key: LocaleKey; label: string; flag: string }[] = [
  { key: "en", label: "🇺🇸 English", flag: "🇺🇸" },
  { key: "de", label: "🇩🇪 Deutsch", flag: "🇩🇪" },
  { key: "es", label: "🇪🇸 Español", flag: "🇪🇸" },
  { key: "zh", label: "🇨🇳 中文", flag: "🇨🇳" },
];

const SidebarSection = ({ label }: { label: string }) => (
  <div className="text-muted fw-semibold" style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", padding: "10px 0 2px" }}>
    {label}
  </div>
);

const SidebarLinks = ({ onNavigate, sidebarPosts }: { onNavigate?: () => void; sidebarPosts: { slug: string; title: string }[] }) => {
  const { locale: en } = useLocale();
  return (
  <>
    <div className="mb-3">
      <SidebarSection label="Daily Puzzles" />
      <Link href="/takes" className="sidebar-link sidebar-link--games" onClick={onNavigate}>{en.sidebar.takes}</Link>
      <Link href="/check" className="sidebar-link sidebar-link--games" onClick={onNavigate}>{en.sidebar.check}</Link>
      <Link href="/smothered" className="sidebar-link sidebar-link--games" onClick={onNavigate}>{en.sidebar.smothered}</Link>
      <Link href="/mate-in-1" className="sidebar-link sidebar-link--games" onClick={onNavigate}>{en.sidebar.mateIn1}</Link>
      <Link href="/mate-in-2" className="sidebar-link sidebar-link--games" onClick={onNavigate}>{en.sidebar.mateIn2}</Link>
      <Link href="/mate-in-3" className="sidebar-link sidebar-link--games" onClick={onNavigate}>{en.sidebar.mateIn3}</Link>
      <Link href="/chess-solitaire" className="sidebar-link sidebar-link--games" onClick={onNavigate}>{en.sidebar.chessSolitaire}</Link>
      <Link href="/solitaire" className="sidebar-link sidebar-link--games" onClick={onNavigate}>{en.sidebar.chainCapture}</Link>
      <Link href="/king-and-pawn" className="sidebar-link sidebar-link--games" onClick={onNavigate}>{en.sidebar.kingAndPawn}</Link>
      <Link href="/rook-endgame" className="sidebar-link sidebar-link--games" onClick={onNavigate}>{en.sidebar.rookEndgame}</Link>
      <Link href="/zugzwang" className="sidebar-link sidebar-link--games" onClick={onNavigate}>{en.sidebar.zugzwang}</Link>
      <Link href="/queen-vs-pawn" className="sidebar-link sidebar-link--games" onClick={onNavigate}>{en.sidebar.queenVsPawn}</Link>

      <SidebarSection label="Play" />
      <Link href="/chess" className="sidebar-link sidebar-link--games" onClick={onNavigate}>{en.sidebar.playChess}</Link>
      <Link href="/minichess" className="sidebar-link sidebar-link--games" onClick={onNavigate}>{en.sidebar.miniChess}</Link>
      <Link href="/survival" className="sidebar-link sidebar-link--games" onClick={onNavigate}>{en.sidebar.survival}</Link>
    </div>
    <div>
      <Link href="/blog" className="sidebar-link sidebar-link--community" onClick={onNavigate}>{en.sidebar.blog}</Link>
      {sidebarPosts.map((post) => (
        <Link
          key={post.slug}
          href={`/blog/${post.slug}`}
          className="sidebar-link sidebar-link--community"
          onClick={onNavigate}
          style={{ whiteSpace: "normal" }}
        >
          {post.title}
        </Link>
      ))}
    </div>
  </>
  );
};

export default function Shell({ children, sidebarPosts = [] }: { children: React.ReactNode; sidebarPosts?: { slug: string; title: string }[] }) {
  const [dark, setDark] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [langOpen, setLangOpen] = useState(false);
  const { user, openAuth } = useAuth();
  const { locale: en, localeKey, setLocale } = useLocale();
  const langRef = useRef<HTMLDivElement>(null);

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

  // Close language dropdown on outside click
  useEffect(() => {
    if (!langOpen) return;
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [langOpen]);

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
              <Link className="navbar-brand fw-bold mb-0 d-none d-lg-inline" href="/">
                {en.siteName}
              </Link>
            </div>

            {/* Right: action buttons */}
            <div className="d-flex align-items-center gap-2">
              {user ? (
                <UserMenu user={user} dark={dark} onToggleDark={() => setDark((d) => !d)} />
              ) : (
                <>
                  <button className="btn rounded-0" style={{ color: "#fff", backgroundColor: "#5cb85c", borderColor: "#4cae4c" }} onClick={() => openAuth("signup")}>{en.nav.signUp}</button>
                  <button className="btn btn-info text-white rounded-0" onClick={() => openAuth("login")}>{en.nav.logIn}</button>
                </>
              )}
              <button
                className="btn btn-outline-secondary rounded-0 d-none d-md-inline-flex align-items-center justify-content-center"
                onClick={() => setDark((d) => !d)}
                title={dark ? en.nav.switchToLight : en.nav.switchToDark}
                aria-label={dark ? en.nav.switchToLight : en.nav.switchToDark}
              >
                {dark ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
              {score > 0 && (
                <span className="badge rounded-0 text-bg-warning" style={{ fontSize: 13 }}>
                  ★ {score.toLocaleString()}
                </span>
              )}

              {/* Language dropdown */}
              <div style={{ position: "relative" }} ref={langRef}>
                <button
                  className="btn btn-outline-secondary rounded-0 d-flex align-items-center gap-1 text-muted small"
                  onClick={() => setLangOpen((o) => !o)}
                  aria-expanded={langOpen}
                  aria-label="Select language"
                >
                  <span>{LOCALE_OPTIONS.find((o) => o.key === localeKey)?.flag ?? "🇺🇸"}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {langOpen && (
                  <div
                    className="dropdown-menu show rounded-0 shadow position-absolute end-0 mt-1"
                    style={{ minWidth: 150, zIndex: 1055 }}
                  >
                    {LOCALE_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        className={`dropdown-item${localeKey === opt.key ? " active" : ""}`}
                        onClick={() => { setLocale(opt.key); setLangOpen(false); }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
          <Link href="/" className="fw-bold text-decoration-none text-body" style={{ fontSize: "1.1rem" }} onClick={() => setMenuOpen(false)}>
            {en.siteName}
          </Link>
          <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={() => setMenuOpen(false)}>{en.nav.close}</button>
        </div>
        <SidebarLinks onNavigate={() => setMenuOpen(false)} sidebarPosts={sidebarPosts} />
      </div>

      {/* Main layout */}
      <div className="container-fluid px-0">
        <div style={{ maxWidth: 1100, margin: "16px auto" }}>
          <div className="row g-0 border">
            {/* Desktop sidebar */}
            <div className="col-auto border-end d-none d-lg-block" style={{ minWidth: 200, maxWidth: 200, width: 200, padding: "20px 24px" }}>
              <SidebarLinks sidebarPosts={sidebarPosts} />
            </div>

            {/* Page content */}
            <div className="col p-4" style={{ minWidth: 0 }}>
              {children}
            </div>
          </div>
        </div>
      </div>
      <Footer />

    </>
  );
}
