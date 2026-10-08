// Routes that render <FreestarHead />. Also used for the tracing config and navigation handler.
export const AD_ROUTES = ["/queen-vs-pawn", "/takes"];


export const isAdRoute = (pathname: string) => {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return AD_ROUTES.includes(path);
};
