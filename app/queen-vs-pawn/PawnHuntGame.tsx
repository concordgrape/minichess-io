"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Chess, type Square, type Move, type PieceSymbol, type Color } from "chess.js";
import Board, { type BoardPiece, type SquareStyle } from "../components/Board";
import { useResponsiveSquare } from "../lib/useResponsiveSquare";
import { saveScore, pawnPoints } from "../lib/scores";
import { pawnCaptured, pawnPromoted } from "./engine";
import type { PawnPuzzle, GameStatus } from "./types";

const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king",
};
const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "success", medium: "warning", hard: "danger",
};

function pieceImage(type: PieceSymbol, color: Color) {
  return `/piece-${PIECE_NAMES[type]}-${color === "w" ? "white" : "black"}.svg`;
}
function sqToRowCol(sq: Square): { row: number; col: number } {
  return { row: 8 - parseInt(sq[1]), col: sq.charCodeAt(0) - 97 };
}
function rowColToSq(row: number, col: number): Square {
  return `${String.fromCharCode(97 + col)}${8 - row}` as Square;
}

export default function PawnHuntGame({ puzzles }: { puzzles: PawnPuzzle[] }) {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const puzzle = puzzles[puzzleIdx];
  const player: Color = "w";
  const { ref: boardRef, size: sq } = useResponsiveSquare(64, 8);

  const [chess] = useState(() => new Chess(puzzles[0].fen));
  const [board, setBoard] = useState(() => chess.board());
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [movesLeft, setMovesLeft] = useState(puzzles[0].winIn);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [defending, setDefending] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  const [defenseTrigger, setDefenseTrigger] = useState(0);
  const pendingDefense = useRef(false);

  const refresh = useCallback(() => setBoard([...chess.board()]), [chess]);

  const load = useCallback((idx: number) => {
    chess.load(puzzles[idx].fen);
    setPuzzleIdx(idx);
    setBoard([...chess.board()]);
    setSelected(null); setLegalMoves([]);
    setStatus("playing"); setMovesLeft(puzzles[idx].winIn);
    setLastMove(null); setDefending(false);
    setUndoCount(0); setEarnedPoints(null);
    pendingDefense.current = false;
  }, [chess, puzzles]);

  function award() {
    const pts = pawnPoints(puzzle.winIn, puzzle.difficulty, undoCount);
    saveScore({ puzzleId: puzzle.id, points: pts, earnedAt: Date.now() });
    setEarnedPoints(pts);
    setStatus("won");
  }

  // Black's reply, computed off the main thread.
  useEffect(() => {
    if (!pendingDefense.current) return;
    pendingDefense.current = false;
    setDefending(true);
    const worker = new Worker(new URL("./defense.worker.ts", import.meta.url));
    worker.postMessage({ fen: chess.fen(), horizonPlies: Math.max(2, movesLeft * 2) });
    worker.onmessage = (e) => {
      const move: Move | null = e.data;
      if (move) {
        chess.move(move);
        setLastMove({ from: move.from as Square, to: move.to as Square });
      }
      refresh();
      if (pawnPromoted(chess)) setStatus("promoted");
      else if (chess.isStalemate() || chess.isDraw()) setStatus("draw");
      setDefending(false);
      worker.terminate();
    };
    return () => worker.terminate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defenseTrigger]);

  function applyMove(from: Square, to: Square) {
    try { chess.move({ from, to }); } catch { return; }
    const remaining = movesLeft - 1;
    setMovesLeft(remaining);
    setLastMove({ from, to });
    setSelected(null); setLegalMoves([]);
    refresh();

    if (pawnCaptured(chess)) { award(); return; }
    if (chess.isStalemate() || chess.isDraw()) { setStatus("draw"); return; }
    if (remaining <= 0) { setStatus("exceeded"); return; }
    pendingDefense.current = true;
    setDefenseTrigger((n) => n + 1);
  }

  function handleSquareClick(row: number, col: number) {
    if (status !== "playing" || defending) return;
    const sq = rowColToSq(row, col);
    if (selected && legalMoves.includes(sq)) { applyMove(selected, sq); return; }
    const piece = chess.get(sq);
    if (piece && piece.color === player) {
      setSelected(sq);
      setLegalMoves((chess.moves({ square: sq, verbose: true }) as Move[]).map((m) => m.to as Square));
    } else { setSelected(null); setLegalMoves([]); }
  }

  function handleDrop(fromRow: number, fromCol: number, toRow: number, toCol: number) {
    if (status !== "playing" || defending) return;
    const from = rowColToSq(fromRow, fromCol), to = rowColToSq(toRow, toCol);
    const legal = (chess.moves({ square: from, verbose: true }) as Move[]).some((m) => m.to === to);
    if (legal) applyMove(from, to);
  }

  function undo() {
    if (defending || chess.history().length === 0) return;
    if (chess.turn() === player) chess.undo();
    chess.undo();
    setMovesLeft((m) => Math.min(puzzle.winIn, m + 1));
    setUndoCount((n) => n + 1);
    setSelected(null); setLegalMoves([]);
    setStatus("playing"); setLastMove(null); setEarnedPoints(null);
    pendingDefense.current = false;
    refresh();
  }

  const canInteract = status === "playing" && !defending;
  const history = chess.history();
  const moveNum = puzzle.winIn - movesLeft + 1;
  const potentialPoints = pawnPoints(puzzle.winIn, puzzle.difficulty, undoCount);

  const pieces: BoardPiece[] = [];
  board.forEach((rowArr, row) => {
    rowArr.forEach((cell, col) => {
      if (!cell) return;
      pieces.push({
        row, col, code: `${cell.color}${cell.type}`,
        imageUrl: pieceImage(cell.type, cell.color),
        draggable: canInteract && cell.color === player,
      });
    });
  });

  const squareStyles: SquareStyle[] = [];
  if (lastMove) {
    const f = sqToRowCol(lastMove.from), t = sqToRowCol(lastMove.to);
    squareStyles.push({ ...f, bg: (f.row + f.col) % 2 === 0 ? "#cdd26a" : "#aaa23a" });
    squareStyles.push({ ...t, bg: (t.row + t.col) % 2 === 0 ? "#cdd26a" : "#aaa23a" });
  }
  if (selected) {
    const { row, col } = sqToRowCol(selected);
    squareStyles.push({ row, col, bg: "#7fc97f" });
    legalMoves.forEach((sq) => {
      const pos = sqToRowCol(sq);
      squareStyles.push({ ...pos, ...(chess.get(sq) ? { ring: true } : { dot: true }) });
    });
  }

  return (
    <div>
      <div className="d-flex flex-wrap gap-2 mb-3">
        {puzzles.map((p, i) => (
          <button key={p.id} onClick={() => load(i)}
            className={`btn btn-sm rounded-0 ${i === puzzleIdx ? "btn-dark" : "btn-outline-secondary"}`}>
            <span className={`badge bg-${DIFFICULTY_COLOR[p.difficulty]} me-1`} style={{ fontSize: 9 }}>{p.difficulty}</span>
            {p.title}
          </button>
        ))}
      </div>

      <div className="d-flex flex-wrap gap-4 align-items-start" ref={boardRef}>
        <div>
          <Board
            size={8}
            squareSize={sq}
            pieces={pieces}
            squareStyles={squareStyles}
            onSquareClick={handleSquareClick}
            onDrop={handleDrop}
            interactive={canInteract}
          />

          <div className="mt-2 d-flex align-items-center gap-2" style={{ minHeight: 32 }}>
            {status === "playing" && (
              <span className="text-muted small">
                {defending ? "Black is pushing…" : `Move ${moveNum} of ${puzzle.winIn} — win the pawn`}
              </span>
            )}
            {status === "won" && (
              <span className="fw-bold text-success">
                ✓ Pawn captured! Puzzle solved.
                {earnedPoints !== null && <span className="ms-2 badge text-bg-warning rounded-0">+{earnedPoints} pts</span>}
              </span>
            )}
            {status === "promoted" && <span className="fw-bold text-danger">✗ The pawn promoted — try again.</span>}
            {status === "draw" && <span className="fw-bold text-danger">✗ Stalemate — try again.</span>}
            {status === "exceeded" && <span className="fw-bold text-danger">✗ Out of moves — try again.</span>}
            {status !== "won" && (
              <span className="badge text-bg-warning rounded-0 ms-auto me-1"
                style={{ opacity: status === "playing" ? 1 : 0.4 }}>
                ★ {potentialPoints} pts
              </span>
            )}
            <div className="d-flex gap-2">
              {history.length > 0 && status !== "won" && !defending && (
                <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={undo}>Undo</button>
              )}
              <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={() => load(puzzleIdx)}>Reset</button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 240 }}>
          <div className="mb-3 d-flex align-items-center gap-2">
            <span className={`badge bg-${DIFFICULTY_COLOR[puzzle.difficulty]} rounded-0`} style={{ fontSize: 13, padding: "6px 10px" }}>
              Win in {puzzle.winIn}
            </span>
            <strong>{puzzle.title}</strong>
          </div>
          <p className="text-muted small mb-3">{puzzle.description}</p>
          <div className="d-flex gap-1 mb-3">
            {Array.from({ length: puzzle.winIn }, (_, i) => (
              <div key={i} style={{
                width: 18, height: 18, borderRadius: "50%",
                backgroundColor: i < puzzle.winIn - movesLeft ? "var(--bs-success)" : "var(--bs-secondary-bg, #444)",
                border: "1px solid #888",
              }} />
            ))}
          </div>
          <div className="small">
            <div className="fw-semibold mb-1">Rules</div>
            <ul className="ps-3 text-muted" style={{ lineHeight: 1.6 }}>
              <li>You play White (king and queen).</li>
              <li>Capture the Black pawn within {puzzle.winIn} move{puzzle.winIn > 1 ? "s" : ""}.</li>
              <li>Black races to promote — if it queens, you lose.</li>
              <li>Use checks to win a tempo and round up the pawn.</li>
            </ul>
          </div>
          {history.length > 0 && (
            <div className="small mt-2">
              <div className="fw-semibold mb-1">Moves</div>
              <table className="table table-sm table-bordered mb-0" style={{ fontFamily: "monospace", fontSize: 12 }}>
                <thead><tr><th>#</th><th>White</th><th>Black</th></tr></thead>
                <tbody>
                  {Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => (
                    <tr key={i}>
                      <td className="text-muted">{i + 1}</td>
                      <td>{history[i * 2]}</td>
                      <td>{history[i * 2 + 1] ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
