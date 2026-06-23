/**
 * Blog post data layer.
 *
 * English posts live in /content/blog/<slug>.md.
 * Translated posts live in /content/blog/<locale>/<slug>.md.
 * If a translated file does not exist, the English version is returned.
 *
 * Frontmatter fields:
 *   title:   string   (required)
 *   date:    string   YYYY-MM-DD (required)
 *   author:  string   (required)
 *   excerpt: string   (required) — shown on the index card
 *   tags:    string[] (optional)
 *
 * To add a post: create /content/blog/<slug>.md (and optionally translated
 * versions) and it appears automatically.
 */

import fs from "fs";
import path from "path";

const POSTS_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  tags: string[];
  contentHtml: string;
}

function parseFrontmatter(raw: string): { meta: Record<string, unknown>; body: string } {
  if (!raw.startsWith("---")) return { meta: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { meta: {}, body: raw };
  const block = raw.slice(4, end);
  const body = raw.slice(end + 4).trimStart();
  const meta: Record<string, unknown> = {};
  for (const line of block.split("\n")) {
    const colon = line.indexOf(":");
    if (colon < 1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim();
    if (val.startsWith("[")) {
      meta[key] = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""));
    } else {
      meta[key] = val.replace(/^["']|["']$/g, "");
    }
  }
  return { meta, body };
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/\n\n+/g, "</p><p>")
    .replace(/^(?!<[a-z])/gm, "")
    .replace(/^(.+)$/gm, (line) =>
      line.startsWith("<") ? line : `<p>${line}</p>`
    );
}

function readPost(slug: string, locale = "en"): BlogPost | null {
  // Try locale-specific file first, fall back to English.
  const localePath = locale !== "en"
    ? path.join(POSTS_DIR, locale, `${slug}.md`)
    : null;
  const defaultPath = path.join(POSTS_DIR, `${slug}.md`);

  const filePath = localePath && fs.existsSync(localePath) ? localePath : defaultPath;
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { meta, body } = parseFrontmatter(raw);
  return {
    slug,
    title: String(meta.title ?? slug),
    date: String(meta.date ?? ""),
    author: String(meta.author ?? "DailyCheckmate"),
    excerpt: String(meta.excerpt ?? ""),
    tags: Array.isArray(meta.tags) ? (meta.tags as string[]) : [],
    contentHtml: markdownToHtml(body),
  };
}

export async function getAllPosts(locale = "en"): Promise<BlogPost[]> {
  if (!fs.existsSync(POSTS_DIR)) return [];
  // Always use English slugs as the source of truth for which posts exist.
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  const posts = files
    .map((f) => readPost(f.replace(/\.md$/, ""), locale))
    .filter((p): p is BlogPost => p !== null);
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPostBySlug(slug: string, locale = "en"): Promise<BlogPost | null> {
  return readPost(slug, locale);
}
