import type { NextConfig } from "next";

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
  outputFileTracingIncludes: { "/*": FREESTAR_FILES },
};

export default nextConfig;
