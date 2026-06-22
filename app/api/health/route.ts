import { getAdminDb, getAdminAuth } from "@/app/lib/firebase-admin";
import { getPuzzleDifficulty } from "@/app/lib/scoring/formulas";

/** GET /api/health
 * Diagnostic endpoint — checks all critical server-side dependencies.
 * Hit this on Vercel to find what's failing.
 */
export async function GET() {
  const results: Record<string, { ok: boolean; error?: string }> = {};

  // 1. Env var present
  results.env_key = { ok: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY };

  // 2. Firebase Admin init
  try {
    getAdminDb();
    results.firebase_init = { ok: true };
  } catch (e) {
    results.firebase_init = { ok: false, error: String(e) };
  }

  // 3. Firestore read
  try {
    await getAdminDb().collection("health").doc("ping").get();
    results.firestore_read = { ok: true };
  } catch (e) {
    results.firestore_read = { ok: false, error: String(e) };
  }

  // 4. Firestore write
  try {
    await getAdminDb().collection("health").doc("ping").set({ ts: new Date() });
    results.firestore_write = { ok: true };
  } catch (e) {
    results.firestore_write = { ok: false, error: String(e) };
  }

  // 5. Auth SDK init
  try {
    await getAdminAuth();
    results.firebase_auth = { ok: true };
  } catch (e) {
    results.firebase_auth = { ok: false, error: String(e) };
  }

  // 6. Puzzle file read
  try {
    const d = await getPuzzleDifficulty("takes", 1);
    results.puzzle_file = { ok: d !== null, error: d === null ? "puzzle id 1 not found in takes.json" : undefined };
  } catch (e) {
    results.puzzle_file = { ok: false, error: String(e) };
  }

  // 7. Survival puzzle file
  try {
    const d = await getPuzzleDifficulty("survival", 0);
    results.survival_file = { ok: d !== null, error: d === null ? "puzzle id 0 not found in survival.json" : undefined };
  } catch (e) {
    results.survival_file = { ok: false, error: String(e) };
  }

  const allOk = Object.values(results).every((r) => r.ok);
  return Response.json({ ok: allOk, checks: results }, { status: allOk ? 200 : 500 });
}
