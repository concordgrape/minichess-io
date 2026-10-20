// Routes without ads. Keep in sync with the app/(no-ads) route group.
export const NO_AD_ROUTES = ["/privacy-policy", "/profile"];

export const isNoAdRoute = (pathname: string) => {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return NO_AD_ROUTES.includes(path);
};
