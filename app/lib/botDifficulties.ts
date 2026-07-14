/**
 * Bot difficulty presets shared by the full chess game (/chess) and
 * Mini Chess (/minichess). `depth` is the minimax search depth and
 * `randomFraction` is the probability of playing a random move instead
 * (simulates lower-ELO blunders).
 */
export interface BotDifficulty {
  label: string;
  rating: string;
  depth: number;
  randomFraction: number;
}

export const BOT_DIFFICULTIES: BotDifficulty[] = [
  { label: "Drunk Rook",      rating: "~100",  depth: 1, randomFraction: 1.00 },
  { label: "Newborn",         rating: "~300",  depth: 1, randomFraction: 0.60 },
  { label: "Club Kid",        rating: "~600",  depth: 1, randomFraction: 0.25 },
  { label: "Patzer",          rating: "~800",  depth: 2, randomFraction: 0.15 },
  { label: "Weekend Warrior", rating: "~1000", depth: 2, randomFraction: 0.05 },
  { label: "Hustler",         rating: "~1200", depth: 3, randomFraction: 0    },
  { label: "Club Champion",   rating: "~1600", depth: 4, randomFraction: 0    },
  { label: "The Beast",       rating: "~2000", depth: 5, randomFraction: 0    },
  { label: "GrandMaster",     rating: "~2400", depth: 6, randomFraction: 0    },
];

export const DEFAULT_DIFFICULTY = 2; // Club Kid
