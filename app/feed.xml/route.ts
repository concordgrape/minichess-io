import { getAllPosts } from "@/app/lib/blog";

const BASE = "https://chesspuzzles.online";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** RSS 2.0 feed for the blog. Served at /feed.xml, revalidated hourly. */
export const revalidate = 3600;

export async function GET() {
  const posts = await getAllPosts();

  const items = posts
    .map((p) => {
      const url = `${BASE}/blog/${p.slug}`;
      const pubDate = new Date(`${p.date}T12:00:00Z`).toUTCString();
      const categories = p.tags.map((t) => `<category>${esc(t)}</category>`).join("");
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${esc(p.excerpt)}</description>
      ${categories}
    </item>`;
    })
    .join("\n");

  const lastBuild = posts.length
    ? new Date(`${posts[0].date}T12:00:00Z`).toUTCString()
    : new Date(0).toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Chess Puzzles Blog</title>
    <link>${BASE}/blog</link>
    <description>Chess tips, puzzle guides, endgame techniques, and strategy articles.</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
