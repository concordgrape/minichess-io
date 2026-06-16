"use client";

const KEY = "minichess_scores";

export interface ScoreEntry {
  puzzleId: string;
  points: number;
  earnedAt: number;
}

export function loadScores(): ScoreEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveScore(entry: ScoreEntry) {
  const existing = loadScores();
  // Keep best score per puzzle
  const others = existing.filter((e) => e.puzzleId !== entry.puzzleId);
  const prev = existing.find((e) => e.puzzleId === entry.puzzleId);
  if (prev && prev.points >= entry.points) return prev.points; // no improvement
  const next = [...others, entry];
  localStorage.setItem(KEY, JSON.stringify(next));
  // Dispatch so other tabs / navbar can react
  window.dispatchEvent(new Event("minichess_score_update"));
  return entry.points;
}

export function totalScore(): number {
  return loadScores().reduce((sum, e) => sum + e.points, 0);
}

/** Calculate points for a Takes puzzle. */
export function takesPoints(
  difficulty: "easy" | "medium" | "hard",
  undoCount: number
): number {
  const base = { easy: 100, medium: 200, hard: 350 }[difficulty];
  const penalty = undoCount * 15;
  return Math.max(base - penalty, Math.round(base * 0.2));
}

/** Calculate points for a Smothered puzzle. */
export function smotheredPoints(
  mateIn: number,
  difficulty: "easy" | "medium" | "hard",
  undoCount: number
): number {
  const base = { easy: 120, medium: 220, hard: 380 }[difficulty];
  const moveBonus = (mateIn - 1) * 30;
  const penalty = undoCount * 15;
  return Math.max(base + moveBonus - penalty, Math.round((base + moveBonus) * 0.2));
}

/** Calculate points for a Mate-in-N puzzle. */
export function matePoints(
  mateIn: number,
  difficulty: "easy" | "medium" | "hard",
  undoCount: number
): number {
  const base = { easy: 100, medium: 200, hard: 350 }[difficulty];
  const moveBonus = (mateIn - 1) * 50;
  const penalty = undoCount * 20;
  return Math.max(base + moveBonus - penalty, Math.round((base + moveBonus) * 0.2));
}

/** Calculate points for a Check puzzle. */
export function checkPoints(
  mateIn: number,
  difficulty: "easy" | "medium" | "hard",
  undoCount: number
): number {
  const base = { easy: 100, medium: 200, hard: 350 }[difficulty];
  const moveBonus = (mateIn - 1) * 25;
  const penalty = undoCount * 15;
  return Math.max(base + moveBonus - penalty, Math.round((base + moveBonus) * 0.2));
}
