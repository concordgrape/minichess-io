"use client";

import { useEffect } from "react";

export type AuthMode = "signup" | "login";

export default function AuthModal({
  mode,
  onClose,
}: {
  mode: AuthMode;
  onClose: () => void;
}) {
  const isSignup = mode === "signup";

  // Close on Escape + lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="auth-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1060,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "6vh 16px",
        overflowY: "auto",
      }}
    >
      <div
        className="auth-dialog card rounded-0 shadow"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isSignup ? "Create an account" : "Log in"}
        style={{ width: "100%", maxWidth: 480 }}
      >
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
          <h2 className="h5 fw-bold mb-0">{isSignup ? "Create an account" : "Log in"}</h2>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
        </div>

        {/* Body */}
        <form
          className="p-3"
          onSubmit={(e) => {
            e.preventDefault();
            onClose();
          }}
        >
          <p className="text-muted text-center mb-3">
            {isSignup
              ? "You won't lose your current results after registration"
              : "Welcome back — pick up right where you left off"}
          </p>

          <button
            type="button"
            className="btn w-100 rounded-0 d-flex align-items-center justify-content-center gap-2 mb-3 text-white"
            style={{ backgroundColor: "#dd4b39", borderColor: "#c23321" }}
          >
            <span
              className="d-inline-flex align-items-center justify-content-center fw-bold"
              style={{ width: 22, height: 22, background: "#fff", color: "#dd4b39", borderRadius: 2 }}
            >
              G
            </span>
            {isSignup ? "Sign up with Google" : "Log in with Google"}
          </button>

          <div className="text-center text-muted small fw-semibold my-3">
            {isSignup
              ? "Or sign up with username and password"
              : "Or log in with username and password"}
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold mb-1">
              {isSignup ? "Username" : "Username or Email"} <span className="text-danger">*</span>
            </label>
            <input type="text" className="form-control rounded-0" required autoFocus />
          </div>

          {isSignup && (
            <div className="mb-3">
              <label className="form-label fw-semibold mb-1">Email</label>
              <input type="email" className="form-control rounded-0" />
            </div>
          )}

          <div className="mb-3">
            <label className="form-label fw-semibold mb-1">
              Password <span className="text-danger">*</span>
            </label>
            <input type="password" className="form-control rounded-0" required />
          </div>

          {isSignup ? (
            <div className="mb-1">
              <label className="form-label fw-semibold mb-1">
                Repeat Password <span className="text-danger">*</span>
              </label>
              <input type="password" className="form-control rounded-0" required />
            </div>
          ) : (
            <div className="d-flex align-items-center justify-content-between mb-1">
              <div className="form-check mb-0">
                <input className="form-check-input rounded-0" type="checkbox" id="auth-remember" />
                <label className="form-check-label small" htmlFor="auth-remember">
                  Remember me
                </label>
              </div>
              <a href="#" className="small text-decoration-none">Forgot password?</a>
            </div>
          )}

          {/* Footer */}
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn btn-outline-secondary rounded-0" onClick={onClose}>
              Close
            </button>
            {isSignup ? (
              <button
                type="submit"
                className="btn rounded-0 text-white"
                style={{ backgroundColor: "#5cb85c", borderColor: "#4cae4c" }}
              >
                Sign up
              </button>
            ) : (
              <button type="submit" className="btn btn-info text-white rounded-0">
                Log in
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
