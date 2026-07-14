import Link from "next/link";
import { getAllPosts, type BlogPost } from "@/app/lib/blog";
import { getLocale } from "@/app/i18n";
import { LOCALE_COOKIE } from "@/app/i18n/index";
import { cookies } from "next/headers";

export const metadata = {
  title: "Chess Blog | Tips, Puzzle Guides, and Strategy",
  description: "Read chess tips, puzzle guides, endgame techniques, and strategy articles from Chess Puzzles. Improve your game one post at a time.",
  keywords: ["chess blog", "chess tips", "chess strategy", "chess puzzle guide", "improve at chess"],
  openGraph: {
    title: "Chess Blog | Chess Puzzles",
    description: "Chess tips, puzzle guides, endgame techniques, and strategy articles to help you improve.",
    url: "https://dailycheckmate.com/blog",
  },
};

function PostCard({ post }: { post: BlogPost }) {
  return (
    <article className="card rounded-0 h-100">
      <div className="card-body d-flex flex-column">
        <div className="mb-2">
          {post.tags.map((tag) => (
            <span key={tag} className="badge text-bg-secondary me-1 rounded-0" style={{ fontSize: "0.7rem" }}>
              {tag}
            </span>
          ))}
        </div>
        <h2 className="h6 fw-bold mb-1">
          <Link href={`/blog/${post.slug}`} className="text-decoration-none text-reset stretched-link">
            {post.title}
          </Link>
        </h2>
        <p className="text-muted small mb-3 flex-grow-1">{post.excerpt}</p>
        <div className="d-flex align-items-center gap-2 mt-auto">
          <span className="text-muted small">{post.author}</span>
          <span className="text-muted small">·</span>
          <time className="text-muted small" dateTime={post.date}>
            {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </time>
        </div>
      </div>
    </article>
  );
}

export default async function BlogIndex() {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE)?.value ?? "en";
  const t = await getLocale();
  const posts = await getAllPosts(locale);

  return (
    <div>
      <h1 className="h4 mb-1">{t.blog.title}</h1>
      <p className="text-muted mb-4">{t.blog.subtitle}</p>

      {posts.length === 0 ? (
        <div className="text-muted py-5 text-center">
          <p className="mb-1 fw-semibold">{t.blog.emptyHeading}</p>
          <p className="small">{t.blog.emptyBody}</p>
        </div>
      ) : (
        <div className="row g-3">
          {posts.map((post) => (
            <div key={post.slug} className="col-12 col-md-6">
              <PostCard post={post} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
