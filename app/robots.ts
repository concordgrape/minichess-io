import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // /profile is intentionally NOT disallowed: it carries a noindex meta tag,
    // which crawlers can only honor if they're allowed to fetch the page.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: "https://dailycheckmate.com/sitemap.xml",
  };
}
