import { MetadataRoute } from "next";
import { getAllPosts } from "./lib/blog";

const BASE = "https://dailycheckmate.com";

const GAME_ROUTES = [
  "/chess",
  "/minichess",
  "/takes",
  "/check",
  "/smothered",
  "/chess-solitaire",
  "/solitaire",
  "/survival",
  "/mate-in-1",
  "/mate-in-2",
  "/mate-in-3",
  "/king-and-pawn",
  "/rook-endgame",
  "/zugzwang",
  "/queen-vs-pawn",
];

// Game pages with custom artwork — listed as sitemap images for Google Images
const GAME_IMAGES: Record<string, string> = {
  "/chess":     `${BASE}/images/chess.png`,
  "/mate-in-1": `${BASE}/images/mate_in_1.webp`,
  "/mate-in-2": `${BASE}/images/mate_in_2.webp`,
  "/mate-in-3": `${BASE}/images/mate_in_3.webp`,
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();

  // Daily puzzle deploys rebuild the site each day, so build time ≈ puzzle date.
  const today = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: today,
      changeFrequency: "daily",
      priority: 1.0,
      images: Object.values(GAME_IMAGES),
    },
    { url: `${BASE}/leaderboard`, changeFrequency: "hourly", priority: 0.6 },
    { url: `${BASE}/top-players`, changeFrequency: "daily", priority: 0.6 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/privacy-policy`, changeFrequency: "yearly", priority: 0.2 },
    ...GAME_ROUTES.map((r) => ({
      url: `${BASE}${r}`,
      lastModified: today,
      changeFrequency: "daily" as const,
      priority: 0.8,
      ...(GAME_IMAGES[r] ? { images: [GAME_IMAGES[r]] } : {}),
    })),
  ];

  const blogRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes];
}
