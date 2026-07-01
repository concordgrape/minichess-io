import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { getPostBySlug, getAllPosts } from "@/app/lib/blog";
import { getLocale, LOCALE_COOKIE } from "@/app/i18n/index";
import JsonLd from "@/app/components/JsonLd";

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
      url: `https://dailycheckmate.com/blog/${slug}`,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      images: [{ url: "https://dailycheckmate.com/og-img.png", width: 1200, height: 630, alt: "Daily Checkmate" }],
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

  return (
    <div style={{ maxWidth: 680 }}>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.excerpt,
        datePublished: post.date,
        author: { "@type": "Person", name: post.author },
        publisher: { "@type": "Organization", name: "Daily Checkmate", url: "https://dailycheckmate.com" },
        url: `https://dailycheckmate.com/blog/${slug}`,
        image: "https://dailycheckmate.com/og-img.png",
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
    </div>
  );
}
