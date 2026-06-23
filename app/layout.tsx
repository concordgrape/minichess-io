import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import Shell from "./Shell";
import AuthProvider from "./AuthProvider";
import { LocaleProvider } from "./i18n/LocaleProvider";
import { getAllPosts } from "./lib/blog";

const openSans = Open_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DailyCheckmate",
  description: "Play chess puzzles and mini games online",
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
        <LocaleProvider>
          <AuthProvider>
            <Shell sidebarPosts={sidebarPosts}>{children}</Shell>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
