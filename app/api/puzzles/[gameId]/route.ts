export const dynamic = "force-dynamic";

const VALID_GAMES = new Set([
  "takes", "solitaire", "check", "smothered", "chess-solitaire",
  "queen-vs-pawn", "king-and-pawn", "rook-endgame", "zugzwang",
  "mate-in-1", "mate-in-2", "mate-in-3", "survival",
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;

    if (!VALID_GAMES.has(gameId)) {
      return Response.json({ error: "unknown_game" }, { status: 404 });
    }

    const { getAdminDb } = await import("@/app/lib/firebase-admin");

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
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[puzzles/list] error:`, e);
    return Response.json({ error: "internal", detail: msg }, { status: 500 });
  }
}
