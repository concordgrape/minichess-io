"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  updateProfile,
  signOut,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider, firebaseEnabled } from "./lib/firebase";
import AuthModal, { type AuthMode } from "./AuthModal";

async function detectCountry(): Promise<string | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.country_name as string) ?? null;
  } catch {
    return null;
  }
}

async function saveCountryIfMissing(uid: string, country: string) {
  if (!db) return;
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists() && snap.data()?.country) return;
  await setDoc(ref, { country, updatedAt: serverTimestamp() }, { merge: true });
}

/** Deterministic guest display name seeded by the user's UID, e.g. "playerKxqwza". */
export function guestName(uid: string): string {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let s = "";
  for (let i = 0; i < 6; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    s += chars[h % 26];
  }
  return "player" + s;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  enabled: boolean;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logInWithGoogle: () => Promise<void>;
  logInAnon: () => Promise<void>;
  logOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  openAuth: (mode: AuthMode) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signUp(username: string, email: string, password: string) {
    if (!auth) throw new Error("Authentication isn't configured.");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: username });
    await cred.user.reload();
    setUser(auth.currentUser);
    detectCountry().then((country) => {
      if (country) saveCountryIfMissing(cred.user.uid, country);
    });
  }

  async function logIn(email: string, password: string) {
    if (!auth) throw new Error("Authentication isn't configured.");
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logInWithGoogle() {
    if (!auth) throw new Error("Authentication isn't configured.");
    const cred = await signInWithPopup(auth, googleProvider);
    detectCountry().then((country) => {
      if (country) saveCountryIfMissing(cred.user.uid, country);
    });
  }

  async function logInAnon() {
    if (!auth) throw new Error("Authentication isn't configured.");
    const cred = await signInAnonymously(auth);
    // Give guests a stable, UID-seeded display name.
    await updateProfile(cred.user, { displayName: guestName(cred.user.uid) });
    await cred.user.reload();
    setUser(auth.currentUser);
  }

  async function logOut() {
    if (!auth) return;
    await signOut(auth);
  }

  // Re-read the current user (e.g. after a displayName change) and force consumers to update.
  async function refreshUser() {
    if (!auth?.currentUser) return;
    await auth.currentUser.reload();
    setUser(auth.currentUser);
    setTick((t) => t + 1);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        enabled: firebaseEnabled,
        signUp,
        logIn,
        logInWithGoogle,
        logInAnon,
        logOut,
        refreshUser,
        openAuth: setAuthMode,
      }}
    >
      {children}
      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} />}
    </AuthContext.Provider>
  );
}
