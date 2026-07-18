/** Display names for game routes, used by the blog → game CTA. */
export const GAME_NAMES: Record<string, string> = {
  "takes":           "Takes",
  "check":           "Check",
  "smothered":       "Smothered Mate",
  "chess-solitaire": "Chess Solitaire",
  "solitaire":       "Chain Capture",
  "king-and-pawn":   "King and Pawn",
  "rook-endgame":    "Rook Endgame",
  "zugzwang":        "Zugzwang",
  "queen-vs-pawn":   "Queen vs Pawn",
  "mate-in-1":       "Mate in 1",
  "mate-in-2":       "Mate in 2",
  "mate-in-3":       "Mate in 3",
  "minichess":       "Mini Chess",
  "survival":        "Survival",
};

/** Reverse lookup: blog slug → the game it teaches. */
export function gameForBlogSlug(slug: string): { href: string; name: string } | null {
  for (const [gameId, guide] of Object.entries(GAME_GUIDES)) {
    if (guide.href === `/blog/${slug}`) {
      return { href: `/${gameId}`, name: GAME_NAMES[gameId] ?? gameId };
    }
  }
  return null;
}

/** Blog guide for each game, shown under the board and used for internal linking. */
export const GAME_GUIDES: Record<string, { href: string; title: string }> = {
  "takes":           { href: "/blog/takes", title: "How to Solve the Takes Puzzle" },
  "check":           { href: "/blog/check-puzzle", title: "How to Win at the Check Puzzle" },
  "smothered":       { href: "/blog/smothered-mate", title: "The Art of the Smothered Mate" },
  "chess-solitaire": { href: "/blog/chess-solitaire", title: "A Guide to Chess Solitaire" },
  "solitaire":       { href: "/blog/chain-capture", title: "Mastering Chain Capture" },
  "king-and-pawn":   { href: "/blog/king-and-pawn-endgame", title: "Understanding the King and Pawn Endgame" },
  "rook-endgame":    { href: "/blog/rook-endgame", title: "How to Win the Rook Endgame" },
  "zugzwang":        { href: "/blog/zugzwang-explained", title: "What Is Zugzwang and How Do You Use It?" },
  "queen-vs-pawn":   { href: "/blog/queen-vs-pawn", title: "How to Stop a Passed Pawn With the Queen" },
  "mate-in-1":       { href: "/blog/mate-in-1", title: "How to Solve Mate in 1 Puzzles Every Time" },
  "mate-in-2":       { href: "/blog/mate-in-2", title: "How to Solve Mate in 2 Puzzles" },
  "mate-in-3":       { href: "/blog/mate-in-3", title: "Thinking Three Moves Ahead in the Mate in 3 Puzzle" },
  "minichess":       { href: "/blog/mini-chess-strategy", title: "How to Win at Mini Chess" },
  "survival":        { href: "/blog/survival-chess-tips", title: "Survival Chess: How to Keep Your Knight Alive" },
};
