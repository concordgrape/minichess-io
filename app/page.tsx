import Link from "next/link";
import Image from "next/image";

interface GameTile {
  href: string;
  title: string;
  image: string;
  description: string;
}

// Image is the same placeholder for every tile for now — swap per-game later.
const PLACEHOLDER = "/og-img.png";

const GAMES: GameTile[] = [
  { href: "/chess", title: "Play Chess", image: PLACEHOLDER, description: "Full chess against the engine — choose your difficulty, from beginner to expert." },
  { href: "/minichess", title: "Mini Chess", image: PLACEHOLDER, description: "A compact 5×5 chess battle against the AI. Same rules, smaller board." },
  { href: "/mate-in-1", title: "Mate in 1", image: PLACEHOLDER, description: "Spot the single move that delivers immediate checkmate." },
  { href: "/mate-in-2", title: "Mate in 2", image: PLACEHOLDER, description: "Force checkmate in two moves against Black's best defense." },
  { href: "/mate-in-3", title: "Mate in 3", image: PLACEHOLDER, description: "Calculate a forced checkmate three moves deep." },
  { href: "/takes", title: "Takes", image: PLACEHOLDER, description: "Capture every piece on the board in the correct order." },
  { href: "/check", title: "Check", image: PLACEHOLDER, description: "Deliver checkmate on the mini board within the move limit." },
  { href: "/smothered", title: "Smothered", image: PLACEHOLDER, description: "Trap the king with its own pieces and land a smothered mate." },
  { href: "/chess-solitaire", title: "Chess Solitaire", image: PLACEHOLDER, description: "Clear the board, capturing one piece at a time." },
  { href: "/solitaire", title: "Chain Capture", image: PLACEHOLDER, description: "Wipe the board in a single unbroken chain of captures." },
  { href: "/survival", title: "Survival", image: PLACEHOLDER, description: "Capture pawns with your knight for as long as you can." },
  { href: "/king-and-pawn", title: "King and Pawn", image: PLACEHOLDER, description: "Promote the pawn with your king's support, then checkmate." },
  { href: "/rook-endgame", title: "Rook Endgame", image: PLACEHOLDER, description: "Cut off the king with the rook and deliver mate." },
  { href: "/zugzwang", title: "Zugzwang", image: PLACEHOLDER, description: "Find the quiet move that leaves your opponent helpless." },
  { href: "/queen-vs-pawn", title: "Queen vs Pawn", image: PLACEHOLDER, description: "Catch the passed pawn with your queen before it promotes." },
];

export default function Home() {
  return (
    <div>
      <h1 className="fw-bold mb-1">DailyCheckmate</h1>
      <p className="text-muted mb-4">Pick a game or puzzle to play.</p>

      <div className="row g-3">
        {GAMES.map((g) => (
          <div key={g.href} className="col-12 col-sm-6 col-lg-4">
            <Link href={g.href} className="text-decoration-none text-reset">
              <div className="card rounded-0 h-100 game-tile">
                <div style={{ position: "relative", aspectRatio: "16 / 9", overflow: "hidden" }}>
                  <Image
                    src={g.image}
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
