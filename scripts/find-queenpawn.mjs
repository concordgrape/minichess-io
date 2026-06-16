import { Chess } from "chess.js";

const BIG = 1_000_000;

function blackState(chess) {
  let pawns = 0, promoted = 0;
  for (const row of chess.board())
    for (const cell of row)
      if (cell && cell.color === "b") {
        if (cell.type === "p") pawns++;
        else if (cell.type !== "k") promoted++;
      }
  return { pawns, promoted };
}

function search(chess, depth) {
  const { pawns, promoted } = blackState(chess);
  if (promoted > 0) return -BIG;
  if (pawns === 0) return BIG;
  if (depth === 0 || chess.isStalemate() || chess.isInsufficientMaterial() || chess.isDraw()) return 0;
  const whiteToMove = chess.turn() === "w";
  let best = whiteToMove ? -Infinity : Infinity;
  for (const m of chess.moves()) {
    chess.move(m);
    let v = search(chess, depth - 1);
    chess.undo();
    if (v > 0) v -= 1; else if (v < 0) v += 1;
    if (whiteToMove) { if (v > best) best = v; if (best >= BIG - 1) break; }
    else { if (v < best) best = v; if (best <= -BIG + 1) break; }
  }
  return best === Infinity || best === -Infinity ? 0 : best;
}

function winDistance(fen, maxN) {
  let chess;
  try { chess = new Chess(fen); } catch { return null; }
  for (let n = 1; n <= maxN; n++) if (search(chess, n * 2 - 1) > 0) return n;
  return null;
}

function bestAttack(chess, h) {
  let bm = null, bs = -Infinity;
  for (const m of chess.moves({ verbose: true })) {
    chess.move(m); let v = search(chess, h - 1); chess.undo();
    if (v > 0) v -= 1; else if (v < 0) v += 1;
    if (v > bs) { bs = v; bm = m; }
  }
  return bm;
}
function bestDef(chess, h) {
  const ms = chess.moves({ verbose: true });
  if (!ms.length) return null;
  let bm = ms[0], bs = Infinity;
  for (const m of ms) {
    chess.move(m); let v = search(chess, h - 1); chess.undo();
    if (v > 0) v -= 1; else if (v < 0) v += 1;
    if (v < bs) { bs = v; bm = m; if (bs <= -BIG + 1) break; }
  }
  return bm;
}
function line(fen, n) {
  const c = new Chess(fen); let used = 0, out = [];
  for (let i = 0; i < n; i++) {
    const am = bestAttack(c, n * 2 - 1); out.push(am.san); c.move(am); used++;
    if (blackState(c).pawns === 0) break;
    const dm = bestDef(c, Math.max(2, (n - used) * 2)); if (dm) { out.push(dm.san); c.move(dm); }
  }
  return out.join(" ");
}

const files = "abcdefgh";
const adj = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) <= 1;
function fenFor(wk, wq, bk, pawn) {
  const b = Array.from({ length: 8 }, () => Array(8).fill(null));
  b[wk[1]][wk[0]] = "K"; b[wq[1]][wq[0]] = "Q"; b[bk[1]][bk[0]] = "k"; b[pawn[1]][pawn[0]] = "p";
  let fen = "";
  for (let r = 7; r >= 0; r--) {
    let e = 0;
    for (let f = 0; f < 8; f++) { const c = b[r][f]; if (!c) e++; else { if (e) { fen += e; e = 0; } fen += c; } }
    if (e) fen += e; if (r > 0) fen += "/";
  }
  return fen + " w - - 0 1";
}

const found = [];
outer:
for (const pf of [1, 2, 4, 6]) {            // b,c,e,g pawn files
  const pawn = [pf, 1];                      // rank 2
  for (let bkf = pf - 1; bkf <= pf + 1; bkf++) for (let bkr = 0; bkr <= 2; bkr++) {
    if (bkf < 0 || bkf > 7) continue;
    const bk = [bkf, bkr];
    if (bk[0] === pawn[0] && bk[1] === pawn[1]) continue;
    for (let wkf = 0; wkf < 8; wkf++) for (let wkr = 0; wkr < 8; wkr++) {
      const wk = [wkf, wkr];
      if (adj(wk, bk) || (wk[0] === pawn[0] && wk[1] === pawn[1])) continue;
      for (let wqf = 0; wqf < 8; wqf++) for (let wqr = 0; wqr < 8; wqr++) {
        const wq = [wqf, wqr];
        if ((wq[0] === wk[0] && wq[1] === wk[1]) || (wq[0] === bk[0] && wq[1] === bk[1]) || (wq[0] === pawn[0] && wq[1] === pawn[1])) continue;
        const fen = fenFor(wk, wq, bk, pawn);
        try { if (new Chess(fen.replace(" w ", " b ")).inCheck()) continue; } catch { continue; }
        if (winDistance(fen, 2) === 2) {
          found.push(fen);
          if (found.length >= 10) break outer;
        }
      }
    }
  }
}

console.log(`found ${found.length} win-in-2 positions:`);
for (const f of found) console.log(`${f}   ::  ${line(f, 2)}`);
