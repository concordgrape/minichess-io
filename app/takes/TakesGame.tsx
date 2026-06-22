"use client";

import { useState, useCallback, useRef } from "react";
import { useResponsiveSquare } from "../lib/useResponsiveSquare";
import type { Piece, Puzzle, GameStatus } from "./types";
import { getLegalCaptures, hasAnyCapture, applyCapture } from "./logic";
import { saveScore, takesPoints } from "../lib/scores";
import { useGameSession } from "../lib/useGameSession";
import { useGamePhase } from "../lib/GameStartContext";
import Board, { type BoardPiece, type SquareStyle } from "../components/Board";
import BoardOverlay from "../components/BoardOverlay";

const PIECE_NAMES: Record<string, string> = {
  p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king",
};
const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "success", medium: "warning", hard: "danger",
};

function pieceImage(type: string) {
  return `/piece-${PIECE_NAMES[type]}-black.svg`;
}

interface MoveRecord { attacker: Piece; target: Piece; piecesBefore: Piece[]; }

export default function TakesGame({ puzzles }: { puzzles: Puzzle[] }) {
  const { ref: boardRef, size: sq } = useResponsiveSquare(88, 4);
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const puzzle = puzzles[puzzleIdx];

  const { submitScore } = useGameSession("takes", puzzle.id);
  const { startedAt, markComplete, resetGame } = useGamePhase();
  const attemptCountRef = useRef(1);

  const [pieces, setPieces] = useState<Piece[]>(() => puzzle.pieces.map((p) => ({ ...p })));
  const [selected, setSelected] = useState<Piece | null>(null);
  const [targets, setTargets] = useState<Piece[]>([]);
  const [history, setHistory] = useState<MoveRecord[]>([]);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [undoCount, setUndoCount] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);

  const reset = useCallback((idx: number) => {
    const p = puzzles[idx];
    setPieces(p.pieces.map((x) => ({ ...x })));
    setSelected(null); setTargets([]);
    setHistory([]); setStatus("playing");
    setUndoCount(0); setEarnedPoints(null);
    setPuzzleIdx(idx);
    resetGame();
    if (puzzles[idx].id !== puzzle.id) attemptCountRef.current = 1;
    else attemptCountRef.current += 1;
  }, [puzzles, puzzle.id]);

  function selectPiece(piece: Piece) {
    if (status !== "playing") return;
    if (selected?.id === piece.id) { setSelected(null); setTargets([]); return; }
    setSelected(piece);
    setTargets(getLegalCaptures(piece, pieces));
  }

  function doCapture(target: Piece) {
    if (!selected || status !== "playing") return;
    const before = pieces;
    const next = applyCapture(pieces, selected.id, target.id);
    setHistory((h) => [...h, { attacker: selected, target, piecesBefore: before }]);
    const nonKing = next.filter((p) => p.type !== "k");
    if (nonKing.length === 0) {
      setPieces(next); setSelected(null); setTargets([]);
      setStatus("won");
      const pts = takesPoints(puzzle.difficulty, undoCount);
      saveScore({ puzzleId: `takes-${puzzle.id}`, points: pts, earnedAt: Date.now() });
      setEarnedPoints(pts);
      submitScore({ timeSeconds: Math.round((Date.now() - startedAt) / 1000), undoCount, totalAttempts: attemptCountRef.current });
      markComplete();
      return;
    }
    const king = next.find((p) => p.type === "k")!;
    if (!hasAnyCapture(next) && getLegalCaptures(king, next).length === 0) {
      setPieces(next); setSelected(null); setTargets([]); setStatus("lost"); return;
    }
    setPieces(next); setSelected(null); setTargets([]);
  }

  function handleSquareClick(row: number, col: number) {
    const piece = pieces.find((p) => p.row === row && p.col === col);
    if (!piece) { setSelected(null); setTargets([]); return; }
    if (selected && targets.find((t) => t.id === piece.id)) { doCapture(piece); return; }
    selectPiece(piece);
  }

  function handleDrop(fromRow: number, fromCol: number, toRow: number, toCol: number) {
    const attacker = pieces.find((p) => p.row === fromRow && p.col === fromCol);
    const target = pieces.find((p) => p.row === toRow && p.col === toCol);
    if (!attacker || !target) return;
    // Validate it's a legal capture
    const caps = getLegalCaptures(attacker, pieces);
    if (!caps.find((t) => t.id === target.id)) return;
    setSelected(attacker);
    setTargets(caps);
    doCapture(target);
  }

  function undo() {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setPieces(last.piecesBefore);
    setHistory((h) => h.slice(0, -1));
    setSelected(null); setTargets([]);
    setStatus("playing"); setUndoCount((n) => n + 1);
  }

  const nonKingCount = pieces.filter((p) => p.type !== "k").length;
  const potentialPoints = takesPoints(puzzle.difficulty, undoCount);

  // Build Board props
  const boardPieces: BoardPiece[] = pieces.map((p) => ({
    row: p.row, col: p.col,
    code: p.type,
    imageUrl: pieceImage(p.type),
    draggable: status === "playing" && p.type !== "k",
  }));

  const squareStyles: SquareStyle[] = [];
  if (selected) squareStyles.push({ row: selected.row, col: selected.col, bg: "#7fc97f" });
  targets.forEach((t) => {
    const hasPiece = pieces.some((p) => p.row === t.row && p.col === t.col);
    squareStyles.push({ row: t.row, col: t.col, ...(hasPiece ? { bg: "#e06060", ring: true } : { bg: "#e09090", dot: true }) });
  });

  return (
    <div>
      <div className="d-flex flex-wrap gap-4 align-items-start" ref={boardRef}>
        <div>
          <BoardOverlay>
<Board
            size={4}
            squareSize={sq}
            pieces={boardPieces}
            squareStyles={squareStyles}
            onSquareClick={handleSquareClick}
            onDrop={handleDrop}
            interactive={status === "playing"}
          />
</BoardOverlay>

          <div className="mt-2 d-flex align-items-center gap-2">
            {status === "playing" && (
              <span className="text-muted small">{nonKingCount} piece{nonKingCount !== 1 ? "s" : ""} left — every move must capture</span>
            )}
            {status === "won" && (
              <span className="fw-bold text-success">
                ✓ Solved! The King stands alone.
                {earnedPoints !== null && <span className="ms-2 badge text-bg-warning rounded-0">+{earnedPoints} pts</span>}
              </span>
            )}
            {status === "lost" && <span className="fw-bold text-danger">✗ Stuck — no captures available.</span>}
            {status !== "won" && (
              <span className="badge text-bg-warning rounded-0 ms-auto me-1" style={{ opacity: status === "lost" ? 0.4 : 1 }}>
                ★ {potentialPoints} pts
              </span>
            )}
            <div className="d-flex gap-2">
              {history.length > 0 && status !== "won" && (
                <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={undo}>Undo</button>
              )}
              <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={() => reset(puzzleIdx)}>Reset</button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 260 }}>
          {puzzles.length > 1 && (
            <select
              className="form-select form-select-sm rounded-0 w-100 mb-3"
              value={puzzleIdx}
              onChange={(e) => reset(Number(e.target.value))}
              aria-label="Select puzzle"
            >
              {puzzles.map((p, i) => (
                <option key={p.id} value={i}>Puzzle {p.id} — {p.difficulty}</option>
              ))}
            </select>
          )}
          <div className="mb-3">
            <span className={`badge bg-${DIFFICULTY_COLOR[puzzle.difficulty]} rounded-0 me-2`}>{puzzle.difficulty}</span>
            <strong>Puzzle #{puzzle.id}</strong>
          </div>
          <div className="mb-3 small">
            <div className="fw-semibold mb-1">Rules</div>
            <ul className="ps-3 text-muted" style={{ lineHeight: 1.6 }}>
              <li>Every move must be a capture.</li>
              <li>The King cannot be captured.</li>
              <li>Sliding pieces are blocked by other pieces.</li>
              <li>Pawns capture diagonally in all 4 directions.</li>
              <li>Win by leaving only the King.</li>
            </ul>
          </div>
          {history.length > 0 && (
            <div className="small">
              <div className="fw-semibold mb-1">Moves</div>
              <ol className="ps-3 text-muted mb-3" style={{ lineHeight: 1.8 }}>
                {history.map((m, i) => (
                  <li key={i}>{PIECE_NAMES[m.attacker.type]} × {PIECE_NAMES[m.target.type]}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
