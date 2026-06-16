"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Board, { type BoardPiece, type SquareStyle } from "../components/Board";
import { getLegalCaptures, applyCapture, hasAnyCapture } from "./logic";
import { saveScore } from "../lib/scores";
import { useResponsiveSquare } from "../lib/useResponsiveSquare";
import type { SolitairePiece, PuzzleDef, GameStatus, MoveRecord, Difficulty } from "./types";

// Chess.com green theme
const LIGHT_SQ = "#eeeed2";
const DARK_SQ  = "#769656";
const SEL_SQ   = "#f6f669";
const SEL_DARK = "#baca2b";
const CAP_SQ   = "#ff6666";
const CAP_DARK = "#cc4444";
const LAST_LIGHT = "#cdd16a";
const LAST_DARK  = "#aaa23a";

const PIECE_NAMES: Record<string, string> = {
  P: "pawn", N: "knight", B: "bishop", R: "rook", Q: "queen", K: "king",
};
const DIFF_COLOR: Record<Difficulty, string> = {
  easy: "success", medium: "warning", hard: "danger", expert: "dark",
};
const DIFF_LABEL: Record<Difficulty, string> = {
  easy: "Easy", medium: "Medium", hard: "Hard", expert: "Expert",
};

function pieceImg(type: string, color: string) {
  return `/piece-${PIECE_NAMES[type]}-${color === "w" ? "white" : "black"}.svg`;
}

function makePieces(defs: PuzzleDef["pieces"]): SolitairePiece[] {
  return defs.map((d, i) => ({ ...d, id: `${d.color}${d.type}${i}` }));
}

interface Props {
  puzzles: PuzzleDef[];
  todayKey: string; // YYYY-MM-DD
}

export default function SolitaireGame({ puzzles, todayKey }: Props) {
  const { ref: boardRef, size: sq } = useResponsiveSquare(64, 8);
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const puzzle = puzzles[puzzleIdx];

  const [pieces, setPieces] = useState<SolitairePiece[]>(() => makePieces(puzzle.pieces));
  const [selected, setSelected] = useState<SolitairePiece | null>(null);
  const [captures, setCaptures] = useState<SolitairePiece[]>([]);
  const [history, setHistory] = useState<MoveRecord[]>([]);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [lastMove, setLastMove] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null);
  const [flash, setFlash] = useState<{ row: number; col: number } | null>(null); // capture flash
  const [hintId, setHintId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("sol_completed") ?? "[]")); }
    catch { return new Set(); }
  });
  const [undoCount, setUndoCount] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dailyPuzzle = puzzles.find((p) => p.dailyDate === todayKey);
  const dailyIdx = dailyPuzzle ? puzzles.indexOf(dailyPuzzle) : -1;

  const resetPuzzle = useCallback((idx: number) => {
    const p = puzzles[idx];
    setPuzzleIdx(idx);
    setPieces(makePieces(p.pieces));
    setSelected(null);
    setCaptures([]);
    setHistory([]);
    setStatus("playing");
    setLastMove(null);
    setFlash(null);
    setHintId(null);
    setUndoCount(0);
    setEarnedPoints(null);
  }, [puzzles]);

  function doCapture(attacker: SolitairePiece, target: SolitairePiece) {
    const before = pieces;
    const next = applyCapture(pieces, attacker.id, target.id);

    setHistory((h) => [...h, { attacker, target, piecesBefore: before }]);
    setLastMove({ from: { row: attacker.row, col: attacker.col }, to: { row: target.row, col: target.col } });
    setSelected(null);
    setCaptures([]);
    setHintId(null);

    // Flash the captured square
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ row: target.row, col: target.col });
    flashTimer.current = setTimeout(() => setFlash(null), 300);

    if (next.length === 1) {
      setPieces(next);
      setStatus("solved");
      const pts = calcPoints(puzzle.difficulty, pieces.length, undoCount);
      const updated = markCompleted(puzzle.id, pts);
      setEarnedPoints(pts);
      saveScore({ puzzleId: puzzle.id, points: pts, earnedAt: Date.now() });
      setCompleted(updated);
    } else if (!hasAnyCapture(next)) {
      setPieces(next);
      setStatus("stuck");
    } else {
      setPieces(next);
    }
  }

  function markCompleted(id: string, pts: number): Set<string> {
    const updated = new Set(completed).add(id);
    try { localStorage.setItem("sol_completed", JSON.stringify([...updated])); } catch {}
    return updated;
  }

  function handleSquareClick(row: number, col: number) {
    if (status !== "playing") return;
    const piece = pieces.find((p) => p.row === row && p.col === col);

    if (selected) {
      // Clicking a capture target
      const target = captures.find((c) => c.row === row && c.col === col);
      if (target) { doCapture(selected, target); return; }
      // Clicking own piece (reselect)
      if (piece) { selectPiece(piece); return; }
      setSelected(null); setCaptures([]);
      return;
    }

    if (piece) selectPiece(piece);
  }

  function handleDrop(fromRow: number, fromCol: number, toRow: number, toCol: number) {
    if (status !== "playing") return;
    const attacker = pieces.find((p) => p.row === fromRow && p.col === fromCol);
    if (!attacker) return;
    const caps = getLegalCaptures(attacker, pieces);
    const target = caps.find((c) => c.row === toRow && c.col === toCol);
    if (target) doCapture(attacker, target);
  }

  function selectPiece(piece: SolitairePiece) {
    setSelected(piece);
    setCaptures(getLegalCaptures(piece, pieces));
    setHintId(null);
  }

  function undo() {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setPieces(last.piecesBefore);
    setHistory((h) => h.slice(0, -1));
    setSelected(null); setCaptures([]);
    setStatus("playing"); setLastMove(null); setHintId(null);
    setUndoCount((n) => n + 1);
  }

  function hint() {
    // Find first piece with captures and highlight it
    const piece = pieces.find((p) => getLegalCaptures(p, pieces).length > 0);
    if (!piece) return;
    setHintId(piece.id);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHintId(null), 2000);
  }

  function calcPoints(diff: Difficulty, pieceCount: number, undos: number): number {
    const base = { easy: 100, medium: 200, hard: 350, expert: 500 }[diff];
    const bonus = Math.max(0, (pieceCount - 3) * 10); // more pieces = more points
    const penalty = undos * 20;
    return Math.max(Math.round(base * 0.2), base + bonus - penalty);
  }

  // Build Board props
  const boardPieces: BoardPiece[] = pieces.map((p) => ({
    row: p.row, col: p.col,
    code: `${p.color}${p.type}`,
    imageUrl: pieceImg(p.type, p.color),
    draggable: status === "playing",
  }));

  const squareStyles: SquareStyle[] = [];
  const light = (r: number, c: number) => (r + c) % 2 === 0;

  // Last move highlight
  if (lastMove) {
    squareStyles.push({ row: lastMove.from.row, col: lastMove.from.col, bg: light(lastMove.from.row, lastMove.from.col) ? LAST_LIGHT : LAST_DARK });
    squareStyles.push({ row: lastMove.to.row, col: lastMove.to.col, bg: light(lastMove.to.row, lastMove.to.col) ? LAST_LIGHT : LAST_DARK });
  }

  // Flash
  if (flash) squareStyles.push({ row: flash.row, col: flash.col, bg: "#ff4444" });

  // Hint highlight
  if (hintId) {
    const hp = pieces.find((p) => p.id === hintId);
    if (hp) squareStyles.push({ row: hp.row, col: hp.col, bg: light(hp.row, hp.col) ? "#ffe599" : "#c8a800" });
  }

  // Selected + captures
  if (selected) {
    squareStyles.push({ row: selected.row, col: selected.col, bg: light(selected.row, selected.col) ? SEL_SQ : SEL_DARK });
    captures.forEach((c) => squareStyles.push({ row: c.row, col: c.col, bg: light(c.row, c.col) ? CAP_SQ : CAP_DARK, ring: true }));
  }

  const remaining = pieces.length;
  const totalMoves = history.length;
  const potentialPts = calcPoints(puzzle.difficulty, puzzle.pieces.length, undoCount);

  return (
    <div>
      {/* Puzzle tabs */}
      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
        {dailyIdx >= 0 && (
          <button
            onClick={() => resetPuzzle(dailyIdx)}
            className={`btn btn-sm rounded-0 ${puzzleIdx === dailyIdx ? "btn-warning" : "btn-outline-warning"}`}
          >
            ★ Daily
          </button>
        )}
        {puzzles.map((p, i) => (
          <button
            key={p.id}
            onClick={() => resetPuzzle(i)}
            className={`btn btn-sm rounded-0 ${i === puzzleIdx ? "btn-dark" : "btn-outline-secondary"} ${completed.has(p.id) ? "opacity-50" : ""}`}
            title={completed.has(p.id) ? "Completed ✓" : p.title}
          >
            <span className={`badge bg-${DIFF_COLOR[p.difficulty]} me-1`} style={{ fontSize: 9 }}>{DIFF_LABEL[p.difficulty]}</span>
            {completed.has(p.id) ? "✓ " : ""}{p.title}
          </button>
        ))}
      </div>

      <div className="d-flex flex-wrap gap-4 align-items-start" ref={boardRef}>
        {/* Board column */}
        <div>
          {/* Puzzle header */}
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className={`badge bg-${DIFF_COLOR[puzzle.difficulty]} rounded-0`} style={{ fontSize: 12, padding: "4px 8px" }}>
              {DIFF_LABEL[puzzle.difficulty]}
            </span>
            <span className="fw-semibold">{puzzle.title}</span>
            {puzzle.dailyDate && <span className="badge bg-warning text-dark rounded-0 ms-1">★ Daily</span>}
          </div>

          <Board
            size={8}
            squareSize={sq}
            pieces={boardPieces}
            squareStyles={squareStyles}
            onSquareClick={handleSquareClick}
            onDrop={handleDrop}
            interactive={status === "playing"}
            lightColor={LIGHT_SQ}
            darkColor={DARK_SQ}
          />

          {/* Status bar */}
          <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
            {status === "playing" && (
              <span className="text-muted small">
                {selected ? `${PIECE_NAMES[selected.type]} selected — click a highlighted piece` : "Click a piece to see captures"}
                {" · "}{remaining} piece{remaining !== 1 ? "s" : ""} left
              </span>
            )}
            {status === "solved" && (
              <span className="fw-bold text-success">
                ✓ Solved in {totalMoves} move{totalMoves !== 1 ? "s" : ""}!
                {earnedPoints !== null && <span className="ms-2 badge text-bg-warning rounded-0">+{earnedPoints} pts</span>}
              </span>
            )}
            {status === "stuck" && (
              <span className="fw-bold text-danger">✗ Stuck! {remaining} piece{remaining !== 1 ? "s" : ""} remain.</span>
            )}
            {status !== "solved" && (
              <span className="badge text-bg-warning rounded-0 ms-auto" style={{ opacity: status === "stuck" ? 0.4 : 1 }}>
                ★ {potentialPts} pts
              </span>
            )}
            <div className="d-flex gap-1">
              {history.length > 0 && status !== "solved" && (
                <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={undo}>Undo</button>
              )}
              {status === "playing" && (
                <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={hint}>Hint</button>
              )}
              <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={() => resetPuzzle(puzzleIdx)}>Restart</button>
              {status !== "playing" && puzzleIdx < puzzles.length - 1 && (
                <button className="btn btn-sm btn-outline-primary rounded-0" onClick={() => resetPuzzle(puzzleIdx + 1)}>
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info panel */}
        <div style={{ minWidth: 220 }}>
          {puzzle.description && (
            <p className="text-muted small mb-3">{puzzle.description}</p>
          )}

          {/* Progress pips */}
          <div className="mb-3">
            <div className="text-muted small text-uppercase mb-1" style={{ letterSpacing: 1, fontSize: 11 }}>Pieces remaining</div>
            <div className="d-flex flex-wrap gap-1">
              {Array.from({ length: puzzle.pieces.length }, (_, i) => (
                <div key={i} style={{
                  width: 14, height: 14, borderRadius: "50%",
                  backgroundColor: i < puzzle.pieces.length - remaining
                    ? "#769656"
                    : "var(--bs-secondary-bg, #444)",
                  border: "1px solid #888",
                  transition: "background-color 0.2s",
                }} />
              ))}
            </div>
            <div className="mt-1 text-muted small">{remaining} of {puzzle.pieces.length} remain</div>
          </div>

          {/* Move history */}
          {history.length > 0 && (
            <div className="small">
              <div className="fw-semibold mb-1">Moves</div>
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                <table className="table table-sm table-bordered mb-0" style={{ fontFamily: "monospace", fontSize: 11 }}>
                  <thead><tr><th>#</th><th>Piece</th><th>Captures</th></tr></thead>
                  <tbody>
                    {history.map((m, i) => (
                      <tr key={i}>
                        <td className="text-muted">{i + 1}</td>
                        <td>{m.attacker.color === "w" ? "♔" : "♚"} {PIECE_NAMES[m.attacker.type]}</td>
                        <td className="text-danger">× {PIECE_NAMES[m.target.type]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-3 small">
            <div className="fw-semibold mb-1">How to play</div>
            <ul className="ps-3 text-muted" style={{ lineHeight: 1.7 }}>
              <li>Click a piece to highlight valid captures.</li>
              <li>Or drag a piece to capture.</li>
              <li>Every move must be a capture.</li>
              <li>Leave only one piece to win.</li>
            </ul>
          </div>

          {/* Progress across all puzzles */}
          <div className="mt-3 small">
            <div className="fw-semibold mb-1">Progress</div>
            <div className="text-muted">{completed.size} / {puzzles.length} puzzles completed</div>
            <div className="progress rounded-0 mt-1" style={{ height: 6 }}>
              <div
                className="progress-bar bg-success"
                style={{ width: `${(completed.size / puzzles.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Win overlay */}
      {status === "solved" && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000 }}
          onClick={() => setStatus("playing")} // dismiss
        >
          <div
            className="p-4 text-center rounded-0"
            style={{ backgroundColor: "var(--bs-body-bg)", border: "2px solid #769656", minWidth: 280 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 48 }}>♛</div>
            <h4 className="fw-bold text-success mt-2">Puzzle Solved!</h4>
            <p className="text-muted mb-1">{puzzle.title}</p>
            <p className="small text-muted mb-3">Completed in {totalMoves} move{totalMoves !== 1 ? "s" : ""}</p>
            {earnedPoints !== null && (
              <div className="badge text-bg-warning rounded-0 fs-6 mb-3">+{earnedPoints} pts</div>
            )}
            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-outline-secondary rounded-0" onClick={() => resetPuzzle(puzzleIdx)}>Play again</button>
              {puzzleIdx < puzzles.length - 1 && (
                <button className="btn btn-success rounded-0" onClick={() => resetPuzzle(puzzleIdx + 1)}>Next puzzle →</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fail overlay */}
      {status === "stuck" && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000 }}
          onClick={() => setStatus("playing")}
        >
          <div
            className="p-4 text-center rounded-0"
            style={{ backgroundColor: "var(--bs-body-bg)", border: "2px solid #cc4444", minWidth: 280 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 48 }}>✗</div>
            <h4 className="fw-bold text-danger mt-2">No Moves Left</h4>
            <p className="text-muted mb-3">{remaining} piece{remaining !== 1 ? "s" : ""} remain with no captures available.</p>
            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-outline-secondary rounded-0" onClick={() => { setStatus("playing"); undo(); }}>
                Undo last move
              </button>
              <button className="btn btn-danger rounded-0" onClick={() => resetPuzzle(puzzleIdx)}>Restart</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
