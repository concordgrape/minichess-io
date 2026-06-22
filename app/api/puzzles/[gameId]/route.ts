import { getAdminDb } from "@/app/lib/firebase-admin";
import { GAME_FORMULAS } from "@/app/lib/scoring/formulas";
import type { GameId } from "@/app/lib/scoring/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  if (!GAME_FORMULAS[gameId as GameId]) {
    return Response.json({ error: "unknown_game" }, { status: 404 });
  }

  try {
    const snap = await getAdminDb()
      .collection("games")
      .doc(gameId)
      .collection("puzzles")
      .orderBy("releaseDate", "desc")
      .limit(60)
      .get();

    const puzzles = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: data.id as number,
        difficulty: data.difficulty as string,
        releaseDate: (data.releaseDate?.toDate?.() as Date | undefined)?.getTime() ?? null,
      };
    });

    return Response.json(puzzles, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (e) {
    console.error(`[puzzles/${gameId}] list error:`, e);
    return Response.json({ error: "internal" }, { status: 500 });
  }
}
