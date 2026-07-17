import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import Shell from "./Shell";
import AuthProvider from "./AuthProvider";
import { LocaleProvider } from "./i18n/LocaleProvider";
import { getAllPosts } from "./lib/blog";
import { Analytics } from "@vercel/analytics/next"
import JsonLd from "./components/JsonLd"

const openSans = Open_Sans({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f5" },
    { media: "(prefers-color-scheme: dark)", color: "#161616" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://dailycheckmate.com"),
  alternates: { canonical: "./" },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
  },
  title: {
    default: "Chess Puzzles",
    template: "%s | Chess Puzzles",
  },
  description:
    "Play free daily chess puzzles online. Mate-in-1, mate-in-2, endgame puzzles, and more — a new challenge every day.",
  keywords: [
    "chess puzzles",
    "daily chess puzzle",
    "mate in one",
    "mate in two",
    "chess endgame puzzles",
    "free chess games online",
    "chess tactics",
  ],
  authors: [{ name: "Chess Puzzles" }],
  openGraph: {
    type: "website",
    siteName: "Chess Puzzles",
    title: "Chess Puzzles",
    description:
      "Play free daily chess puzzles online. Mate-in-1, mate-in-2, endgame puzzles, and more — a new challenge every day.",
    url: "https://dailycheckmate.com",
  },
  twitter: {
    card: "summary",
    title: "Chess Puzzles",
    description:
      "Play free daily chess puzzles online. Mate-in-1, mate-in-2, endgame puzzles, and more.",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const allPosts = await getAllPosts();
  const shuffled = [...allPosts].sort(() => Math.random() - 0.5);
  const sidebarPosts = shuffled.slice(0, 4).map((p) => ({ slug: p.slug, title: p.title }));

  return (
    <html lang="en" className={openSans.className}>
      <body>
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Chess Puzzles",
          url: "https://dailycheckmate.com",
          applicationCategory: "GameApplication",
          operatingSystem: "Web",
          description: "Free daily chess puzzles — mate-in-1, mate-in-2, endgame puzzles, and more.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }} />
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Chess Puzzles",
          url: "https://dailycheckmate.com",
          publisher: {
            "@type": "Organization",
            name: "Chess Puzzles",
            url: "https://dailycheckmate.com",
            logo: { "@type": "ImageObject", url: "https://dailycheckmate.com/og-img.png" },
          },
        }} />
        <Analytics />
        <LocaleProvider>
          <AuthProvider>
            <Shell sidebarPosts={sidebarPosts}>{children}</Shell>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
