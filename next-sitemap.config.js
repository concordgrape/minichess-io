/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://dailycheckmate.com",
  generateRobotsTxt: true,
  changefreq: "daily",
  priority: 0.7,
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/", disallow: ["/api/"] },
    ],
  },
  // /profile is user-specific, no SEO value
  exclude: ["/profile"],
};
