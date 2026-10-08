import type { NextConfig } from "next";
import { AD_ROUTES } from "./app/lib/freestar/routes";

const FREESTAR_FILES = ["./app/lib/freestar/*.js"];

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "firebase-admin",
    "firebase-admin/app",
    "firebase-admin/auth",
    "firebase-admin/firestore",
    "jwks-rsa",
    "jose",
  ],
  // FreestarHead reads these at request time; Next can't trace the dynamic path.
  outputFileTracingIncludes: Object.fromEntries(
    AD_ROUTES.map((route) => [route, FREESTAR_FILES]),
  ),
};

export default nextConfig;
