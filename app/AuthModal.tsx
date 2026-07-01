"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

export type AuthMode = "signup" | "login";

function friendlyError(err: unknown): string {
  // Never surface raw Firebase error codes/messages to the user | log them for
  // debugging and return a generic, human-friendly message instead.
  if (process.env.NODE_ENV !== "production") console.error(err);
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/email-already-in-use": return "That email is already registered.";
    case "auth/invalid-email": return "Please enter a valid email address.";
    case "auth/weak-password": return "Password should be at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found": return "Incorrect email or password.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request": return "Sign-in was cancelled.";
    case "auth/popup-blocked": return "Your browser blocked the sign-in popup. Please allow popups and try again.";
    case "auth/too-many-requests": return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed": return "Network error. Check your connection and try again.";
    case "auth/user-disabled": return "This account has been disabled.";
    default: return "Something went wrong. Please try again.";
  }
}

export default function AuthModal({
  mode,
  onClose,
}: {
  mode: AuthMode;
  onClose: () => void;
}) {
  const isSignup = mode === "signup";
  const { signUp, logIn, logInWithGoogle, logInAnon, enabled } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!enabled) {
      setError("Authentication isn't configured yet.");
      return;
    }
    if (isSignup && password !== repeat) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      if (isSignup) await signUp(email.trim(), password);
      else await logIn(email.trim(), password);
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    if (!enabled) {
      setError("Authentication isn't configured yet.");
      return;
    }
    setBusy(true);
    try {
      await logInWithGoogle();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGuest() {
    setError(null);
    if (!enabled) {
      setError("Authentication isn't configured yet.");
      return;
    }
    setBusy(true);
    try {
      await logInAnon();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

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
        <form className="p-3" onSubmit={handleSubmit}>
          <p className="text-muted text-center mb-3">
            {isSignup
              ? "You won't lose your current results after registration"
              : "Welcome back | pick up right where you left off"}
          </p>

          {error && (
            <div className="alert alert-danger rounded-0 py-2 px-3 small mb-3" role="alert">
              {error}
            </div>
          )}

          <button
            type="button"
            className="btn w-100 rounded-0 d-flex align-items-center justify-content-center gap-2 mb-3 text-white"
            style={{ backgroundColor: "#dd4b39", borderColor: "#c23321" }}
            onClick={handleGoogle}
            disabled={busy}
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
              : "Or log in with email and password"}
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold mb-1">
              Email <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              className="form-control rounded-0"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold mb-1">
              Password <span className="text-danger">*</span>
            </label>
            <input
              type="password"
              className="form-control rounded-0"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isSignup ? (
            <div className="mb-1">
              <label className="form-label fw-semibold mb-1">
                Repeat Password <span className="text-danger">*</span>
              </label>
              <input
                type="password"
                className="form-control rounded-0"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                required
              />
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

          <div className="text-center mt-3">
            <button type="button" className="btn btn-link btn-sm text-decoration-none text-muted" onClick={handleGuest} disabled={busy}>
              or continue as a guest
            </button>
          </div>

          {/* Footer */}
          <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
            <button type="button" className="btn btn-outline-secondary rounded-0" onClick={onClose} disabled={busy}>
              Close
            </button>
            {isSignup ? (
              <button
                type="submit"
                className="btn rounded-0 text-white"
                style={{ backgroundColor: "#5cb85c", borderColor: "#4cae4c" }}
                disabled={busy}
              >
                {busy ? "Creating…" : "Sign up"}
              </button>
            ) : (
              <button type="submit" className="btn btn-info text-white rounded-0" disabled={busy}>
                {busy ? "Logging in…" : "Log in"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
