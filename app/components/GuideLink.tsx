import Link from "next/link";
import { GAME_GUIDES } from "../lib/gameGuides";

/** "Want to go deeper?" blog-guide link, shown under the board in each game's left column. */
export default function GuideLink({ gameId }: { gameId: string }) {
  const guide = GAME_GUIDES[gameId];
  if (!guide) return null;
  return (
    <p className="mt-3 small text-muted">
      Want to go deeper?{" "}
      <Link href={guide.href}>{guide.title}</Link>
    </p>
  );
}
