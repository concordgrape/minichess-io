// Routes that render <FreestarHead />. Also used for the tracing config and navigation handler.
export const AD_ROUTES = [
  "/check",
  "/chess-solitaire",
  "/chess",
  "/king-and-pawn",
  "/mate-in-1",
  "/mate-in-2",
  "/mate-in-3",
  "/minichess",
  "/queen-vs-pawn",
  "/rook-endgame",
  "/smothered",
  "/solitaire",
  "/survival",
  "/takes",
  "/zugzwang",
];


export const isAdRoute = (pathname: string) => {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return AD_ROUTES.includes(path);
};
