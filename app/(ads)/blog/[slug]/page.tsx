import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { getPostBySlug, getAllPosts } from "@/app/lib/blog";
import { getLocale, LOCALE_COOKIE } from "@/app/i18n/index";
import JsonLd from "@/app/components/JsonLd";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import { gameForBlogSlug } from "@/app/lib/gameGuides";

/** Extract FAQ pairs from question-style H2 headings and the paragraph that follows. */
function extractFaq(contentHtml: string): { question: string; answer: string }[] {
  const faq: { question: string; answer: string }[] = [];
  const re = /<h2>([^<]*[?？])<\/h2>(?:<\/p>)?\s*<p>([\s\S]*?)<\/p>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(contentHtml)) !== null) {
    faq.push({ question: m[1].trim(), answer: m[2].replace(/<[^>]+>/g, "").trim() });
  }
  return faq;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://chesspuzzles.online/blog/${slug}`,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      images: [{ url: "https://chesspuzzles.online/og-img.png", width: 1200, height: 630, alt: "Chess Puzzles" }],
    },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE)?.value ?? "en";
  const post = await getPostBySlug(slug, locale);
  if (!post) notFound();

  const t = await getLocale();
  const faq = extractFaq(post.contentHtml);
  const game = gameForBlogSlug(slug);

  return (
    <div style={{ maxWidth: 680 }}>
      <Breadcrumbs items={[
        { name: "Home", url: "https://chesspuzzles.online" },
        { name: "Blog", url: "https://chesspuzzles.online/blog" },
        { name: post.title, url: `https://chesspuzzles.online/blog/${slug}` },
      ]} />
      {faq.length > 0 && (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }} />
      )}
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        datePublished: post.date,
        author: { "@type": "Person", name: post.author },
        publisher: { "@type": "Organization", name: "Chess Puzzles", url: "https://chesspuzzles.online" },
        url: `https://chesspuzzles.online/blog/${slug}`,
        image: "https://chesspuzzles.online/og-img.png",
      }} />
      <Link href="/blog" className="text-muted small text-decoration-none d-inline-flex align-items-center gap-1 mb-4">
        ← {t.blog.backToAll}
      </Link>

      <div className="mb-2">
        {post.tags.map((tag) => (
          <span key={tag} className="badge text-bg-secondary me-1 rounded-0" style={{ fontSize: "0.7rem" }}>
            {tag}
          </span>
        ))}
      </div>

      <h1 className="h3 fw-bold mb-2">{post.title}</h1>

      <div className="d-flex align-items-center gap-2 text-muted small mb-4">
        <span>{post.author}</span>
        <span>·</span>
        <time dateTime={post.date}>
          {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </time>
      </div>

      <hr className="mb-4" />

      <div
        className="blog-content"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />

      {game && (
        <div className="mt-4 p-3 border rounded-0 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <span className="fw-semibold">Ready to try it yourself?</span>
          <Link href={game.href} className="btn btn-success rounded-0">
            Play {game.name} →
          </Link>
        </div>
      )}
    </div>
  );
}
