import { NextRequest } from "next/server";
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";
import { verifyFirebaseToken, getAdminDb } from "@/app/lib/firebase-admin";

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

export async function POST(request: NextRequest) {
  // Auth
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  let uid: string;
  try {
    const decoded = await verifyFirebaseToken(authHeader.slice(7));
    uid = decoded.uid;
  } catch {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  // Parse body
  const body = await request.json().catch(() => null) as {
    username?: unknown;
    email?: unknown;
    country?: unknown;
    publicInfo?: unknown;
  } | null;
  if (!body) return Response.json({ error: "invalid_request" }, { status: 400 });

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const email    = typeof body.email    === "string" ? body.email.trim()    : "";
  const country  = typeof body.country  === "string" ? body.country.trim()  : "";
  const publicInfo = typeof body.publicInfo === "string" ? body.publicInfo.trim() : "";

  // Validate username
  if (username) {
    if (/\s/.test(username)) {
      return Response.json({ error: "username_has_spaces", message: "Username cannot contain spaces." }, { status: 422 });
    }
    if (username.length < 2 || username.length > 30) {
      return Response.json({ error: "username_length", message: "Username must be 2–30 characters." }, { status: 422 });
    }
    if (matcher.hasMatch(username)) {
      return Response.json({ error: "username_inappropriate", message: "That username isn't allowed." }, { status: 422 });
    }
  }

  try {
    await getAdminDb().collection("users").doc(uid).set(
      { username, email, country, publicInfo, updatedAt: new Date() },
      { merge: true }
    );
    return Response.json({ saved: true });
  } catch (e) {
    console.error("[profile/update] Firestore error:", e);
    return Response.json({ error: "db_error" }, { status: 500 });
  }
}
