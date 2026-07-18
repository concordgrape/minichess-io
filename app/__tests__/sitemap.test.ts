/**
 * Guards the sitemap against drift: every blog post on disk must appear,
 * and every game route must be listed.
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import sitemap from "../sitemap";

const BASE = "https://chesspuzzles.online";

describe("sitemap", () => {
  it("includes every blog post that exists on disk", async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    const slugs = fs
      .readdirSync(path.join(process.cwd(), "content", "blog"))
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""));

    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      expect(urls).toContain(`${BASE}/blog/${slug}`);
    }
  });

  it("includes the homepage, blog index, and key pages", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    for (const p of ["", "/blog", "/leaderboard", "/top-players", "/privacy-policy"]) {
      expect(urls).toContain(`${BASE}${p}`);
    }
  });

  it("includes every game route", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    const games = [
      "/chess", "/minichess", "/takes", "/check", "/smothered",
      "/chess-solitaire", "/solitaire", "/survival", "/mate-in-1",
      "/mate-in-2", "/mate-in-3", "/king-and-pawn", "/rook-endgame",
      "/zugzwang", "/queen-vs-pawn",
    ];
    for (const g of games) {
      expect(urls).toContain(`${BASE}${g}`);
    }
  });

  it("gives blog posts a lastModified matching their publish date", async () => {
    const entries = await sitemap();
    const post = entries.find((e) => e.url.endsWith("/blog/daily-puzzle-habit"));
    expect(post?.lastModified).toEqual(new Date("2026-07-18"));
  });
});
