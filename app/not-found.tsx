import Link from "next/link";

export const metadata = {
  title: "404 — Page Not Found | Chessful",
  description: "This page is off the board. Head back home or jump into a chess puzzle.",
};

export default function NotFound() {
  return (
    <div className="text-center py-5">
      <div className="d-inline-flex flex-column align-items-center" style={{ maxWidth: 460 }}>
        {/* 4 ♞ 4 — the knight stands in for the zero */}
        <div
          className="fw-bold lh-1 mb-3"
          style={{ fontSize: "clamp(72px, 18vw, 140px)", letterSpacing: 6 }}
          aria-label="404"
        >
          <span>4</span>
          <span style={{ color: "#1f86b3" }}>♞</span>
          <span>4</span>
        </div>

        {/* Checkerboard divider */}
        <div className="d-flex mb-4" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 20,
                height: 20,
                backgroundColor: i % 2 === 0 ? "#f0d9b5" : "#b58863",
              }}
            />
          ))}
        </div>

        <h1 className="h3 fw-bold mb-2">This move is off the board</h1>
        <p className="text-muted mb-4">
          The page you&apos;re looking for isn&apos;t in our opening book, it may have been
          moved, captured, or never existed.
        </p>

        <div className="d-flex flex-wrap gap-2 justify-content-center">
          <Link href="/" className="btn btn-info text-white rounded-0 px-4">
            Back to Home
          </Link>
          <Link href="/chess" className="btn btn-outline-secondary rounded-0 px-4">
            Play Chess
          </Link>
        </div>
      </div>
    </div>
  );
}
