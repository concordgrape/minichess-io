import { NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/app/lib/firebase-admin";

export const revalidate = 3600;

const fetchGlobal = unstable_cache(
  async (limit: number) => {
    const snap = await getAdminDb()
      .collection("users")
      .where("globalScore", ">", 0)
      .orderBy("globalScore", "desc")
      .limit(limit)
      .get();
    return snap.docs.map((d, i) => ({
      rank: i + 1,
      uid: d.id,
      displayName: (d.data().displayName as string) ?? "Unknown",
      globalScore: (d.data().globalScore as number) ?? 0,
      gamesPlayed: Object.keys((d.data().gamesBest as object) ?? {}).length,
    }));
  },
  ["lb-global"],
  { revalidate: 3600 }
);

/** GET /api/scores/leaderboard/global?limit=25 */
export async function GET(request: NextRequest) {
  const limit = Math.min(100, Math.max(1, parseInt(
    request.nextUrl.searchParams.get("limit") ?? "25", 10
  )));
  const entries = await fetchGlobal(limit);
  return Response.json({ entries });
}
