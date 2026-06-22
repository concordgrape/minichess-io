import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin", "firebase-admin/auth", "firebase-admin/app", "firebase-admin/firestore"],
};

export default nextConfig;
