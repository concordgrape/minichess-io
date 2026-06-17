"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider, firebaseEnabled } from "./lib/firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  enabled: boolean;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
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
    // Username becomes the account's display name.
    await updateProfile(cred.user, { displayName: username });
    await cred.user.reload();
    setUser(auth.currentUser);
  }

  async function logIn(email: string, password: string) {
    if (!auth) throw new Error("Authentication isn't configured.");
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logInWithGoogle() {
    if (!auth) throw new Error("Authentication isn't configured.");
    await signInWithPopup(auth, googleProvider);
  }

  async function logOut() {
    if (!auth) return;
    await signOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, enabled: firebaseEnabled, signUp, logIn, logInWithGoogle, logOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
