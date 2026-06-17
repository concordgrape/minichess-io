import { readFileSync, writeFileSync } from "fs";

// Which position field(s) each game keeps. Everything else (title, description,
// mateIn, winIn, dailyDate, date) is dropped — hardcoded on the site instead.
const KEEP = {
  "mate-in-1": ["fen"],
  "mate-in-2": ["fen"],
  "mate-in-3": ["fen"],
  "king-and-pawn": ["fen"],
  "rook-endgame": ["fen"],
  "zugzwang": ["fen"],
  "queen-vs-pawn": ["fen"],
  "check": ["board"],
  "smothered": ["board"],
  "solitaire": ["board", "start"],
  "takes": ["pieces"],
  "chess-solitaire": ["pieces"],
};

for (const [name, posKeys] of Object.entries(KEEP)) {
  const path = `public/games/${name}.json`;
  const arr = JSON.parse(readFileSync(path, "utf-8"));
  const out = arr.map((p, i) => {
    const o = { id: i + 1, difficulty: p.difficulty };
    for (const k of posKeys) o[k] = p[k];
    return o;
  });
  writeFileSync(path, JSON.stringify(out, null, 2) + "\n");
  console.log(`${name}: ${out.length} puzzles → {id, difficulty, ${posKeys.join(", ")}}`);
}

// minichess is a single daily position (no difficulty).
{
  const path = "public/games/minichess.json";
  const o = JSON.parse(readFileSync(path, "utf-8"));
  writeFileSync(path, JSON.stringify({ id: 1, board: o.board }, null, 2) + "\n");
  console.log("minichess: 1 position → {id, board}");
}
