"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { User } from "firebase/auth";
import { useAuth } from "./AuthProvider";

function svgProps() {
  return {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

const UserIcon = () => (
  <svg {...svgProps()}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" /></svg>
);
const GearIcon = () => (
  <svg {...svgProps()}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const WrenchIcon = () => (
  <svg {...svgProps()}><path d="M14.7 6.3a4 4 0 0 0 5.3 5.3l-8 8a2.83 2.83 0 0 1-4-4l8-8a4 4 0 0 0-1.3-1.3z" transform="rotate(0)" /><path d="M14.7 6.3a4 4 0 1 0-5.4 5.4" /></svg>
);
const LogOutIcon = () => (
  <svg {...svgProps()}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
);

function displayNameOf(user: User): string {
  return user.displayName || user.email?.split("@")[0] || "Player";
}

export default function UserMenu({ user }: { user: User }) {
  const { logOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        className="btn btn-outline-secondary rounded-0 d-flex align-items-center gap-2"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <UserIcon />
        <span
          className="fw-semibold"
          style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {displayNameOf(user)}
        </span>
        <span aria-hidden="true">▾</span>
      </button>

      {open && (
        <div
          className="dropdown-menu show rounded-0 shadow position-absolute end-0 mt-1"
          style={{ display: "block", minWidth: 200, zIndex: 1055 }}
        >
          <Link className="dropdown-item d-flex align-items-center gap-2 py-2" href="/profile" onClick={() => setOpen(false)}>
            <WrenchIcon /> Account
          </Link>
          <hr className="dropdown-divider my-1" />
          <button
            className="dropdown-item d-flex align-items-center gap-2 py-2"
            onClick={() => {
              setOpen(false);
              logOut();
            }}
          >
            <LogOutIcon /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
