"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Board as BoardType, Puzzle, GameStatus, Square, HistoryEntry } from "./types";
import { getLegalCaptures, applyCapture, pieceCount, cloneBoard } from "./logic";
import { saveScore } from "../lib/scores";
import { useResponsiveSquare } from "../lib/useResponsiveSquare";
import Board, { type BoardPiece, type SquareStyle } from "../components/Board";

const STORAGE_VERSION = "solitaire-v1";

const PIECE_NAMES: Record<string, string> = {
  p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king",
};
const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "success", medium: "warning", hard: "danger",
};

function pieceImage(type: string) {
  return `/piece-${PIECE_NAMES[type]}-black.svg`;
}

/** Calculate points: base + piece bonus − undo penalty */
function solitairePoints(
  difficulty: "easy" | "medium" | "hard",
  totalPieces: number,
  undoCount: number
): number {
  const base = { easy: 100, medium: 200, hard: 350 }[difficulty];
  const bonus = Math.max(0, (totalPieces - 4) * 20);
  const penalty = undoCount * 15;
  return Math.max(Math.round((base + bonus) * 0.2), base + bonus - penalty);
}

interface SavedState {
  puzzleId: number;
  board: BoardType;
  pos: Square;
  history: HistoryEntry[];
  status: GameStatus;
  undoCount: number;
}

function storageKey(puzzleId: number) { return `${STORAGE_VERSION}-${puzzleId}`; }

function loadSaved(puzzleId: number): SavedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(puzzleId));
    if (!raw) return null;
    const s: SavedState = JSON.parse(raw);
    return s.puzzleId === puzzleId ? s : null;
  } catch { return null; }
}

function writeSaved(state: SavedState) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(storageKey(state.puzzleId), JSON.stringify(state)); } catch { /* ignore */ }
}

export default function SolitaireGame({ puzzles }: { puzzles: Puzzle[] }) {
  const { ref: boardRef, size: sq } = useResponsiveSquare(88, 4);
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const puzzle = puzzles[puzzleIdx];

  const saved = typeof window !== "undefined" ? loadSaved(puzzle.id) : null;

  const [board, setBoard] = useState<BoardType>(() => saved?.board ?? puzzle.board.map((r) => [...r]));
  const [pos, setPos] = useState<Square>(() => saved?.pos ?? puzzle.start);
  const [legalCaptures, setLegalCaptures] = useState<Square[]>(() =>
    (() => { const b = saved?.board ?? puzzle.board.map((r) => [...r]); const p = saved?.pos ?? puzzle.start; return getLegalCaptures(b, p.row, p.col); })()
  );
  const [status, setStatus] = useState<GameStatus>(() => saved?.status ?? "playing");
  const [history, setHistory] = useState<HistoryEntry[]>(() => saved?.history ?? []);
  const [undoCount, setUndoCount] = useState(() => saved?.undoCount ?? 0);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  const [justTransformed, setJustTransformed] = useState(false);
  const isFirstRender = useRef(true);

  // Persist on state changes
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    writeSaved({ puzzleId: puzzle.id, board, pos, history, status, undoCount });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, status, undoCount]);

  const resetToFresh = useCallback((p: Puzzle) => {
    const freshBoard = p.board.map((r) => [...r]);
    setBoard(freshBoard);
    setPos(p.start);
    setLegalCaptures(getLegalCaptures(freshBoard, p.start.row, p.start.col));
    setStatus("playing");
    setHistory([]);
    setUndoCount(0);
    setEarnedPoints(null);
    setJustTransformed(false);
    isFirstRender.current = true;
  }, []);

  const reset = useCallback((idx: number) => {
    const p = puzzles[idx];
    setPuzzleIdx(idx);
    const sv = loadSaved(p.id);
    if (sv) {
      setBoard(sv.board);
      setPos(sv.pos);
      setLegalCaptures(getLegalCaptures(sv.board, sv.pos.row, sv.pos.col));
      setStatus(sv.status);
      setHistory(sv.history);
      setUndoCount(sv.undoCount);
      setEarnedPoints(null);
      setJustTransformed(false);
      isFirstRender.current = true;
    } else {
      resetToFresh(p);
    }
  }, [puzzles, resetToFresh]);

  function doCapture(to: Square) {
    if (status !== "playing") return;
    const boardBefore = cloneBoard(board);

    setHistory((h) => [...h, { board: boardBefore, pos }]);
    const next = applyCapture(board, pos, to);
    const remaining = pieceCount(next);

    // Trigger transform animation
    setJustTransformed(true);
    setTimeout(() => setJustTransformed(false), 350);

    if (remaining === 1) {
      setBoard(next);
      setPos(to);
      setLegalCaptures([]);
      setStatus("won");
      const pts = solitairePoints(puzzle.difficulty, pieceCount(puzzle.board.map((r) => [...r])), undoCount);
      saveScore({ puzzleId: `solitaire-${puzzle.id}`, points: pts, earnedAt: Date.now() });
      setEarnedPoints(pts);
      return;
    }

    const nextCaptures = getLegalCaptures(next, to.row, to.col);
    setBoard(next);
    setPos(to);
    setLegalCaptures(nextCaptures);
    if (nextCaptures.length === 0) {
      setStatus("lost");
    }
  }

  function handleSquareClick(row: number, col: number) {
    if (status !== "playing") return;
    // Clicking the current piece — no-op (already selected)
    if (row === pos.row && col === pos.col) return;
    // Clicking a legal capture target
    const isTarget = legalCaptures.some((s) => s.row === row && s.col === col);
    if (isTarget) doCapture({ row, col });
  }

  function handleDrop(fromRow: number, fromCol: number, toRow: number, toCol: number) {
    if (status !== "playing") return;
    // Only allow dragging from the controlled piece
    if (fromRow !== pos.row || fromCol !== pos.col) return;
    const isTarget = legalCaptures.some((s) => s.row === toRow && s.col === toCol);
    if (isTarget) doCapture({ row: toRow, col: toCol });
  }

  function undo() {
    if (history.length === 0 || status === "won") return;
    const last = history[history.length - 1];
    setBoard(last.board);
    setPos(last.pos);
    setLegalCaptures(getLegalCaptures(last.board, last.pos.row, last.pos.col));
    setHistory((h) => h.slice(0, -1));
    setStatus("playing");
    setUndoCount((n) => n + 1);
  }

  const totalPieces = pieceCount(puzzle.board.map((r) => [...r]));
  const remaining = pieceCount(board);
  const moveCount = history.length;
  const potentialPoints = solitairePoints(puzzle.difficulty, totalPieces, undoCount);
  const currentType = board[pos.row]?.[pos.col];

  // Build board pieces
  const boardPieces: BoardPiece[] = [];
  board.forEach((rowArr, row) => {
    rowArr.forEach((cell, col) => {
      if (!cell) return;
      boardPieces.push({
        row, col,
        code: cell,
        imageUrl: pieceImage(cell),
        draggable: status === "playing" && row === pos.row && col === pos.col,
      });
    });
  });

  // Build square styles
  const squareStyles: SquareStyle[] = [];

  // Controlled piece: yellow ring
  squareStyles.push({
    row: pos.row, col: pos.col,
    bg: justTransformed
      ? ((pos.row + pos.col) % 2 === 0 ? "#ffe082" : "#ffb300")
      : ((pos.row + pos.col) % 2 === 0 ? "#f6f669" : "#baca2b"),
  });

  // Legal capture targets: red ring
  legalCaptures.forEach((s) => {
    squareStyles.push({
      row: s.row, col: s.col,
      bg: (s.row + s.col) % 2 === 0 ? "#ff9999" : "#cc4444",
      ring: true,
    });
  });

  const isTerminal = status !== "playing";

  return (
    <div>
      <div className="d-flex flex-wrap gap-4 align-items-start" ref={boardRef}>
        {/* Board + status */}
        <div>
          <Board
            size={4}
            squareSize={sq}
            pieces={boardPieces}
            squareStyles={squareStyles}
            onSquareClick={handleSquareClick}
            onDrop={handleDrop}
            interactive={status === "playing"}
          />

          <div className="mt-2 d-flex align-items-center gap-2 flex-wrap" style={{ minHeight: 32 }}>
            {status === "playing" && (
              <span className="text-muted small">
                {currentType
                  ? <>You are a <strong>{PIECE_NAMES[currentType]}</strong> · {remaining} piece{remaining !== 1 ? "s" : ""} left</>
                  : "Select a target to capture"}
                {legalCaptures.length === 0
                  ? <span className="text-danger ms-1">— no captures!</span>
                  : <span className="ms-1 text-success">· {legalCaptures.length} capture{legalCaptures.length !== 1 ? "s" : ""} available</span>}
              </span>
            )}
            {status === "won" && (
              <span className="fw-bold text-success">
                ✓ Board cleared in {moveCount} move{moveCount !== 1 ? "s" : ""}!
                {earnedPoints !== null && (
                  <span className="ms-2 badge text-bg-warning rounded-0">+{earnedPoints} pts</span>
                )}
              </span>
            )}
            {status === "lost" && (
              <span className="fw-bold text-danger">
                ✗ No captures available — {remaining} piece{remaining !== 1 ? "s" : ""} remain.
              </span>
            )}

            {status !== "won" && (
              <span
                className="badge text-bg-warning rounded-0 ms-auto me-1"
                style={{ opacity: isTerminal ? 0.4 : 1 }}
              >
                ★ {potentialPoints} pts
              </span>
            )}

            <div className="d-flex gap-2">
              {history.length > 0 && status !== "won" && (
                <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={undo}>Undo</button>
              )}
              <button
                className="btn btn-sm btn-outline-secondary rounded-0"
                onClick={() => {
                  localStorage.removeItem(storageKey(puzzle.id));
                  resetToFresh(puzzle);
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ maxWidth: 250 }}>
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
          <div className="mb-2">
            <span className={`badge bg-${DIFFICULTY_COLOR[puzzle.difficulty]} rounded-0 me-2`}>{puzzle.difficulty}</span>
            <strong>Puzzle #{puzzle.id}</strong>
          </div>

          {/* Progress pips */}
          <div className="d-flex gap-1 mb-3 flex-wrap">
            {Array.from({ length: totalPieces - 1 }, (_, i) => (
              <div key={i} style={{
                width: 16, height: 16, borderRadius: "50%",
                backgroundColor: i < moveCount ? "var(--bs-success)" : "var(--bs-secondary-bg, #444)",
                border: "1px solid #888",
                transition: "background-color 0.2s",
              }} />
            ))}
          </div>

          <div className="small mb-3">
            <div className="fw-semibold mb-1">Rules</div>
            <ul className="ps-3 text-muted" style={{ lineHeight: 1.6 }}>
              <li>You control <strong>one piece</strong> (yellow square).</li>
              <li>Capture a piece to <strong>transform into it</strong>.</li>
              <li>Clear every piece to win.</li>
              <li>If you have no captures, you lose.</li>
              <li>The King is just another piece to capture.</li>
            </ul>
          </div>

          {/* Transformation chain */}
          {history.length > 0 && (
            <div className="small">
              <div className="fw-semibold mb-1">Transformation chain</div>
              <div className="d-flex flex-wrap align-items-center gap-1">
                {history.map((h, i) => {
                  const type = h.board[h.pos.row][h.pos.col];
                  return (
                    <span key={i} className="d-flex align-items-center gap-1">
                      {type && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pieceImage(type)} alt={PIECE_NAMES[type] ?? type} width={22} height={22} />
                      )}
                      <span className="text-muted" style={{ fontSize: 12 }}>→</span>
                    </span>
                  );
                })}
                {currentType && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pieceImage(currentType)} alt={PIECE_NAMES[currentType]}
                    width={26} height={26}
                    style={{ outline: "2px solid #f6c90e", borderRadius: 2 }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
