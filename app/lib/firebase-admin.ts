import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let _app: App | undefined;
let _auth: Auth | undefined;

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

export function getAdminAuth(): Auth {
  if (!_auth) _auth = getAuth(getAdminApp());
  return _auth;
}
