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

// Verify a Firebase ID token without touching firebase-admin/auth (which pulls
// jwks-rsa → jose ESM, crashing Vercel's CJS runtime). Firebase tokens are
// standard RS256 JWTs — we verify them directly via jose + Google's public JWKS.
export async function verifyFirebaseToken(token: string): Promise<{ uid: string; name?: string; email?: string }> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set");
  const { createRemoteJWKSet, jwtVerify } = await import("jose");
  const JWKS = createRemoteJWKSet(
    new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
  );
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ["RS256"],
  });
  return {
    uid: payload.sub as string,
    name: payload["name"] as string | undefined,
    email: payload["email"] as string | undefined,
  };
}
