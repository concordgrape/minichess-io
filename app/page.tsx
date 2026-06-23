import Link from "next/link";
import Image from "next/image";
import { getLocale } from "@/app/i18n";

const PLACEHOLDER = "/og-img.png";

export default async function Home() {
  const en = await getLocale();
  const { gameTiles, home } = en;
  const GAMES = [
    { href: "/chess",          ...gameTiles.chess },
    { href: "/minichess",      ...gameTiles.minichess },
    { href: "/mate-in-1",      ...gameTiles.mateIn1 },
    { href: "/mate-in-2",      ...gameTiles.mateIn2 },
    { href: "/mate-in-3",      ...gameTiles.mateIn3 },
    { href: "/takes",          ...gameTiles.takes },
    { href: "/check",          ...gameTiles.check },
    { href: "/smothered",      ...gameTiles.smothered },
    { href: "/chess-solitaire",...gameTiles.chessSolitaire },
    { href: "/solitaire",      ...gameTiles.solitaire },
    { href: "/survival",       ...gameTiles.survival },
    { href: "/king-and-pawn",  ...gameTiles.kingAndPawn },
    { href: "/rook-endgame",   ...gameTiles.rookEndgame },
    { href: "/zugzwang",       ...gameTiles.zugzwang },
    { href: "/queen-vs-pawn",  ...gameTiles.queenVsPawn },
  ];

  return (
    <div>
      <h1 className="fw-bold mb-1">{home.title}</h1>
      <p className="text-muted mb-4">{home.subtitle}</p>

      <div className="row g-3">
        {GAMES.map((g) => (
          <div key={g.href} className="col-12 col-sm-6 col-lg-4">
            <Link href={g.href} className="text-decoration-none text-reset">
              <div className="card rounded-0 h-100 game-tile">
                <div style={{ position: "relative", aspectRatio: "16 / 9", overflow: "hidden" }}>
                  <Image
                    src={PLACEHOLDER}
                    alt={g.title}
                    fill
                    sizes="(max-width: 576px) 100vw, (max-width: 992px) 50vw, 33vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className="card-body">
                  <h2 className="h6 fw-bold mb-1 card-title">{g.title}</h2>
                  <p className="card-text text-muted small mb-0">{g.description}</p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
