import { Chess } from "chess.js";

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

function mateDistance(fen, maxN = 4) {
  let chess;
  try { chess = new Chess(fen); } catch { return null; }
  const attacker = chess.turn();
  for (let n = 1; n <= maxN; n++) {
    if (search(chess, n * 2 - 1, attacker) > 0) return n;
  }
  return null;
}

// ---- mode A: validate an explicit candidate list passed as JSON ----
if (process.argv[2]) {
  const candidates = JSON.parse(process.argv[2]);
  for (const c of candidates) {
    const dist = mateDistance(c.fen, 3);
    console.log(`${dist === c.n ? "OK " : "BAD"} want=${c.n} got=${dist}  ${c.id}  ${c.fen}`);
  }
  process.exit(0);
}

// ---- mode B: brute-force generate KQK / KRK / KRRK positions, bucket by distance ----
const files = "abcdefgh";
const sq = (f, r) => files[f] + (r + 1);
const adjacent = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) <= 1;

function tryFen(pieces) {
  // pieces: array of {p, f, r}; white to move
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (const { p, f, r } of pieces) board[r][f] = p;
  // build FEN ranks from rank 8 down
  let fen = "";
  for (let r = 7; r >= 0; r--) {
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const c = board[r][f];
      if (!c) empty++;
      else { if (empty) { fen += empty; empty = 0; } fen += c; }
    }
    if (empty) fen += empty;
    if (r > 0) fen += "/";
  }
  fen += " w - - 0 1";
  return fen;
}

const buckets = { 1: [], 2: [], 3: [] };
const seen = new Set();

function consider(fen) {
  if (seen.has(fen)) return;
  seen.add(fen);
  const d = mateDistance(fen, 3);
  if (d && buckets[d]) buckets[d].push(fen);
}

// Fixed black-king corners/edges; white king kept within a small region nearby.
const blackKings = [[7, 7], [0, 7], [7, 0], [0, 0], [7, 3], [3, 7]];

for (const [bkf, bkr] of blackKings) {
  for (let wkf = 0; wkf < 8; wkf++) for (let wkr = 0; wkr < 8; wkr++) {
    const wk = [wkf, wkr], bk = [bkf, bkr];
    if (adjacent(wk, bk)) continue;
    if (wkf === bkf && wkr === bkr) continue;
    // keep the white king reasonably close so mates are short
    if (Math.max(Math.abs(wkf - bkf), Math.abs(wkr - bkr)) > 3) continue;
    for (let pf = 0; pf < 8; pf++) for (let pr = 0; pr < 8; pr++) {
      if ((pf === wkf && pr === wkr) || (pf === bkf && pr === bkr)) continue;
      for (const heavy of ["Q", "R"]) {
        const fen = tryFen([
          { p: "K", f: wkf, r: wkr }, { p: "k", f: bkf, r: bkr }, { p: heavy, f: pf, r: pr },
        ]);
        consider(fen);
      }
    }
  }
}

for (const n of [1, 2, 3]) {
  console.log(`\n=== mate in ${n}: ${buckets[n].length} found, sample: ===`);
  const arr = buckets[n];
  const step = Math.max(1, Math.floor(arr.length / 10));
  for (let i = 0; i < arr.length && i < step * 10; i += step) console.log(arr[i]);
}
