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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/leaderboard`, changeFrequency: "hourly", priority: 0.6 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.7 },
    ...GAME_ROUTES.map((r) => ({
      url: `${BASE}${r}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
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
