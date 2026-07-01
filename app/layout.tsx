import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import Shell from "./Shell";
import AuthProvider from "./AuthProvider";
import { LocaleProvider } from "./i18n/LocaleProvider";
import { getAllPosts } from "./lib/blog";
import { Analytics } from "@vercel/analytics/next"

const openSans = Open_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://dailycheckmate.com"),
  title: {
    default: "Daily Checkmate | Daily Chess Puzzles",
    template: "%s | Daily Checkmate",
  },
  description:
    "Play free daily chess puzzles online. Mate-in-1, mate-in-2, endgame puzzles, and more | a new challenge every day.",
  keywords: [
    "chess puzzles",
    "daily chess puzzle",
    "mate in one",
    "mate in two",
    "chess endgame puzzles",
    "free chess games online",
    "chess tactics",
  ],
  authors: [{ name: "Daily Checkmate" }],
  openGraph: {
    type: "website",
    siteName: "Daily Checkmate",
    title: "Daily Checkmate | Daily Chess Puzzles",
    description:
      "Play free daily chess puzzles online. Mate-in-1, mate-in-2, endgame puzzles, and more | a new challenge every day.",
    url: "https://dailycheckmate.com",
  },
  twitter: {
    card: "summary",
    title: "Daily Checkmate | Daily Chess Puzzles",
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
