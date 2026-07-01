export const dynamic = "force-dynamic";

const VALID_GAMES = new Set([
  "takes", "solitaire", "check", "smothered", "chess-solitaire",
  "queen-vs-pawn", "king-and-pawn", "rook-endgame", "zugzwang",
  "mate-in-1", "mate-in-2", "mate-in-3", "survival",
]);

const PAGE_SIZE = 100;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;

    if (!VALID_GAMES.has(gameId)) {
      return Response.json({ error: "unknown_game" }, { status: 404 });
    }

    const url = new URL(request.url);
    const after = url.searchParams.get("after"); // last seen ID (cursor)

    const { getAdminDb } = await import("@/app/lib/firebase-admin");

    let query = getAdminDb()
      .collection("games")
      .doc(gameId)
      .collection("puzzles")
      .where("id", "<", 20000000)
      .orderBy("id", "desc")
      .limit(PAGE_SIZE);

    if (after !== null) {
      const afterId = parseInt(after, 10);
      if (!isNaN(afterId)) {
        query = query.where("id", "<", afterId);
      }
    }

    const snap = await query.get();

    const puzzles = snap.docs.map((d) => {
      const data = d.data();
      const ts = data.releaseDate;
      const releaseDate: string | null = ts?.toDate ? ts.toDate().toISOString().slice(0, 10) : null;
      return {
        id: data.id as number,
        difficulty: data.difficulty as string,
        releaseDate,
      };
    });

    const hasMore = puzzles.length === PAGE_SIZE;

    return Response.json({ puzzles, hasMore }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[puzzles/list] error:`, e);
    return Response.json({ error: "internal", detail: msg }, { status: 500 });
  }
}
