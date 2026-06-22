import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _app: App | undefined;

function getAdminApp(): App {
  if (_app) return _app;
  const existing = getApps();
  if (existing.length) { _app = existing[0]; return _app; }
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY env var is not set");
  _app = initializeApp({ credential: cert(JSON.parse(key)) });
  return _app;
}

export const getAdminDb = (): Firestore => getFirestore(getAdminApp());

// Lazy-loaded to avoid pulling in jwks-rsa/jose at module evaluation time,
// which breaks on Vercel due to a CommonJS/ESM conflict in jose v5+.
export async function getAdminAuth() {
  const { getAuth } = await import("firebase-admin/auth");
  return getAuth(getAdminApp());
}
