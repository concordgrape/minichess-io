import { Chess } from "chess.js";
import { readFileSync } from "fs";

const MATE = 1_000_000;

function search(chess, depth, attacker) {
  if (chess.isCheckmate()) return chess.turn() === attacker ? -MATE : MATE;
  if (depth === 0 || chess.isStalemate() || chess.isInsufficientMaterial() || chess.isDraw()) return 0;
  const maximizing = chess.turn() === attacker;
  let best = maximizing ? -Infinity : Infinity;
  for (const m of chess.moves()) {
    chess.move(m);
    let v = search(chess, depth - 1, attacker);
    chess.undo();
    if (v > 0) v -= 1; else if (v < 0) v += 1;
    if (maximizing) { if (v > best) best = v; if (best >= MATE - 1) break; }
    else { if (v < best) best = v; if (best <= 0) break; }
  }
  return best === Infinity || best === -Infinity ? 0 : best;
}

// Pick the attacker's move that mates fastest.
function bestAttack(chess, horizon) {
  const attacker = chess.turn();
  let bestMove = null, bestScore = -Infinity;
  for (const m of chess.moves({ verbose: true })) {
    chess.move(m);
    let v = search(chess, horizon - 1, attacker);
    chess.undo();
    if (v > 0) v -= 1; else if (v < 0) v += 1;
    if (v > bestScore) { bestScore = v; bestMove = m; }
  }
  return { move: bestMove, score: bestScore };
}

// Defender's move that resists longest (mirror of engine.bestDefense).
function bestDefense(chess, horizon) {
  const defender = chess.turn();
  const attacker = defender === "w" ? "b" : "w";
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;
  let bestMove = moves[0], bestScore = Infinity;
  for (const m of moves) {
    chess.move(m);
    let v = search(chess, horizon - 1, attacker);
    chess.undo();
    if (v > 0) v -= 1; else if (v < 0) v += 1;
    if (v < bestScore) { bestScore = v; bestMove = m; if (bestScore <= 0) break; }
  }
  return bestMove;
}

let failures = 0;
for (const [file, n] of [
  ["public/mate-in-1-puzzles.json", 1],
  ["public/mate-in-2-puzzles.json", 2],
  ["public/mate-in-3-puzzles.json", 3],
]) {
  const puzzles = JSON.parse(readFileSync(file, "utf-8"));
  for (const p of puzzles) {
    const chess = new Chess(p.fen);
    let solved = false, moves = 0;
    for (let i = 0; i < n; i++) {
      const { move } = bestAttack(chess, n * 2 - 1);
      if (!move) break;
      chess.move(move);
      moves++;
      if (chess.isCheckmate()) { solved = true; break; }
      if (chess.isStalemate()) break;
      const movesLeft = n - moves;
      const def = bestDefense(chess, Math.max(2, movesLeft * 2));
      if (def) chess.move(def);
      if (chess.isStalemate()) break;
    }
    const status = solved && moves <= n ? "OK " : "FAIL";
    if (!solved || moves > n) failures++;
    console.log(`${status} ${p.id} solved=${solved} movesUsed=${moves}/${n}`);
  }
}
console.log(failures === 0 ? "\nALL PUZZLES SOLVABLE ✓" : `\n${failures} FAILURES ✗`);
process.exit(failures === 0 ? 0 : 1);
