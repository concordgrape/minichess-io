"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Board as BoardType, Puzzle, GameStatus, Square } from "./types";
import { saveScore, checkPoints } from "../lib/scores";
// import { useGameSession } from "../lib/useGameSession";
import { useGamePhase } from "../lib/GameStartContext";
import {
  cloneBoard, findKing, isCheckmate, isStalemate, isInCheck,
  blackBestMove, applyKingMove, applyWhiteMove, getWhitePieceMoves,
} from "./logic";
import Board, { type BoardPiece, type SquareStyle } from "../components/Board";
import BoardOverlay from "../components/BoardOverlay";
import { useResponsiveSquare } from "../lib/useResponsiveSquare";

const STORAGE_VERSION = "check-v1";

// mate-in-N is hardcoded by difficulty (puzzle JSON only carries id/difficulty/board).
const MATE_BY_DIFF: Record<"easy" | "medium" | "hard", number> = { easy: 2, medium: 3, hard: 4 };

const PIECE_NAMES: Record<string, string> = {
  k: "king", p: "pawn", R: "rook", B: "bishop", N: "knight", Q: "queen", K: "king", P: "pawn",
};
const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "success", medium: "warning", hard: "danger",
};

function pieceImage(code: string) {
  const color = code === "k" || code === "p" ? "black" : "white";
  return `/piece-${PIECE_NAMES[code]}-${color}.svg`;
}

interface HistoryEntry {
  whiteFrom: Square; whiteTo: Square; blackTo: Square | null; boardBefore: BoardType;
}

interface SavedState {
  puzzleId: number;
  board: BoardType;
  history: HistoryEntry[];
  status: GameStatus;
  movesLeft: number;
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

export default function CheckGame({ puzzle }: { puzzle: Puzzle }) {
  const { ref: boardRef, size: sq } = useResponsiveSquare(88, 4);

  // const { submitScore } = useGameSession("check", puzzle.id);
  const { startedAt, resetGame } = useGamePhase();
  const mateIn = MATE_BY_DIFF[puzzle.difficulty];

  const saved = typeof window !== "undefined" ? loadSaved(puzzle.id) : null;

  const [board, setBoard] = useState<BoardType>(() => saved?.board ?? puzzle.board.map((r) => [...r]));
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalSquares, setLegalSquares] = useState<Square[]>([]);
  const [status, setStatus] = useState<GameStatus>(() => saved?.status ?? "playing");
  const [movesLeft, setMovesLeft] = useState(() => saved?.movesLeft ?? mateIn);
  const [history, setHistory] = useState<HistoryEntry[]>(() => saved?.history ?? []);
  const [kingThinking, setKingThinking] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [undoCount, setUndoCount] = useState(() => saved?.undoCount ?? 0);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  const [pendingBlack, setPendingBlack] = useState<BoardType | null>(null);
  const isFirstRender = useRef(true);

  // Persist game state whenever it changes (skip first render to avoid overwriting saved state)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (kingThinking) return;
    writeSaved({ puzzleId: puzzle.id, board, history, status, movesLeft, undoCount });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, status, movesLeft, undoCount]);

  const reset = useCallback(() => {
    setBoard(puzzle.board.map((r) => [...r]));
    setSelected(null); setLegalSquares([]);
    setStatus("playing");
    setMovesLeft(mateIn);
    setHistory([]);
    setKingThinking(false);
    setLastMove(null);
    setUndoCount(0);
    setEarnedPoints(null); setPendingBlack(null);
    isFirstRender.current = true;
    resetGame();
  }, [puzzle, mateIn]);

  useEffect(() => {
    if (!pendingBlack) return;
    setKingThinking(true);
    const id = setTimeout(() => {
      const blackMove = blackBestMove(pendingBlack);
      if (blackMove) {
        const next = applyKingMove(pendingBlack, blackMove);
        setBoard(next);
        setLastMove({ from: findKing(pendingBlack), to: blackMove });
        setHistory((h) => {
          const last = h[h.length - 1];
          return [...h.slice(0, -1), { ...last, blackTo: blackMove }];
        });
        if (isCheckmate(next)) {
          setStatus("checkmate");
          const pts = checkPoints(mateIn, puzzle.difficulty, undoCount);
          saveScore({ puzzleId: `check-${puzzle.id}`, points: pts, earnedAt: Date.now() });
          setEarnedPoints(pts);
          // submitScore({ timeSeconds: Math.round((Date.now() - startedAt) / 1000), undoCount, totalAttempts: attemptCountRef.current });
          // markComplete();
        } else if (isStalemate(next)) { setStatus("stalemate"); }
      }
      setPendingBlack(null); setKingThinking(false);
    }, 300);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingBlack]);

  function awardCheckmate(b: BoardType) {
    const pts = checkPoints(mateIn, puzzle.difficulty, undoCount);
    saveScore({ puzzleId: `check-${puzzle.id}`, points: pts, earnedAt: Date.now() });
    setEarnedPoints(pts);
    setBoard(b); setStatus("checkmate");
    // submitScore({ timeSeconds: Math.round((Date.now() - startedAt) / 1000), undoCount, totalAttempts: attemptCountRef.current });
    // markComplete();
  }

  function applyWhiteTurn(from: Square, to: Square) {
    if (status !== "playing" || kingThinking) return;
    const boardBefore = cloneBoard(board);
    const next = applyWhiteMove(board, from, to);
    const remaining = movesLeft - 1;
    setMovesLeft(remaining);
    setHistory((h) => [...h, { whiteFrom: from, whiteTo: to, blackTo: null, boardBefore }]);
    setLastMove({ from, to });
    setSelected(null); setLegalSquares([]);
    if (isCheckmate(next)) { awardCheckmate(next); return; }
    if (isStalemate(next)) { setBoard(next); setStatus("stalemate"); return; }
    if (remaining <= 0) { setBoard(next); setStatus("exceeded"); return; }
    setBoard(next); setPendingBlack(next);
  }

  function handleSquareClick(row: number, col: number) {
    if (status !== "playing" || kingThinking) return;
    const piece = board[row][col];
    if (selected) {
      const isTarget = legalSquares.some((s) => s.row === row && s.col === col);
      if (isTarget) { applyWhiteTurn(selected, { row, col }); return; }
      if (piece && piece !== "k" && piece !== "p") {
        setSelected({ row, col });
        setLegalSquares(getWhitePieceMoves(board, row, col));
        return;
      }
      setSelected(null); setLegalSquares([]); return;
    }
    if (piece && piece !== "k" && piece !== "p") {
      setSelected({ row, col });
      setLegalSquares(getWhitePieceMoves(board, row, col));
    }
  }

  function handleDrop(fromRow: number, fromCol: number, toRow: number, toCol: number) {
    if (status !== "playing" || kingThinking) return;
    const piece = board[fromRow][fromCol];
    if (!piece || piece === "k" || piece === "p") return;
    const moves = getWhitePieceMoves(board, fromRow, fromCol);
    if (!moves.some((m) => m.row === toRow && m.col === toCol)) return;
    applyWhiteTurn({ row: fromRow, col: fromCol }, { row: toRow, col: toCol });
  }

  function undo() {
    if (history.length === 0 || kingThinking) return;
    const last = history[history.length - 1];
    setBoard(last.boardBefore);
    setHistory((h) => h.slice(0, -1));
    setMovesLeft((m) => m + 1); setUndoCount((n) => n + 1);
    setSelected(null); setLegalSquares([]);
    setStatus("playing"); setLastMove(null); setPendingBlack(null);
  }

  const king = findKing(board);
  const kingInCheck = isInCheck(board);
  const moveNum = mateIn - movesLeft + 1;
  const potentialPoints = checkPoints(mateIn, puzzle.difficulty, undoCount);
  const canInteract = status === "playing" && !kingThinking;

  // Build Board props
  const boardPieces: BoardPiece[] = [];
  board.forEach((rowArr, row) => {
    rowArr.forEach((cell, col) => {
      if (!cell) return;
      boardPieces.push({
        row, col, code: cell,
        imageUrl: pieceImage(cell),
        draggable: canInteract && cell !== "k" && cell !== "p",
      });
    });
  });

  const squareStyles: SquareStyle[] = [];
  if (lastMove) {
    const f = lastMove.from, t = lastMove.to;
    squareStyles.push({ row: f.row, col: f.col, bg: (f.row + f.col) % 2 === 0 ? "#cdd26a" : "#aaa23a" });
    squareStyles.push({ row: t.row, col: t.col, bg: (t.row + t.col) % 2 === 0 ? "#cdd26a" : "#aaa23a" });
  }
  if (selected) {
    squareStyles.push({ row: selected.row, col: selected.col, bg: "#7fc97f" });
    legalSquares.forEach((s) => {
      const hasPiece = !!board[s.row][s.col];
      squareStyles.push({ row: s.row, col: s.col, ...(hasPiece ? { ring: true } : { dot: true }) });
    });
  }
  if (king.row >= 0 && kingInCheck) squareStyles.push({ row: king.row, col: king.col, bg: "#ff6b6b" });

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
            interactive={canInteract}
          />
</BoardOverlay>

          <div className="mt-2 d-flex align-items-center gap-2" style={{ minHeight: 32 }}>
            {status === "playing" && (
              <span className="text-muted small">
                {kingThinking ? "King is thinking…" : `Move ${moveNum} of ${mateIn} — your turn`}
                {kingInCheck && !kingThinking && " · Check!"}
              </span>
            )}
            {status === "checkmate" && (
              <span className="fw-bold text-success">
                ✓ Checkmate! Puzzle solved.
                {earnedPoints !== null && <span className="ms-2 badge text-bg-warning rounded-0">+{earnedPoints} pts</span>}
              </span>
            )}
            {status === "stalemate" && <span className="fw-bold text-danger">✗ Stalemate — try again.</span>}
            {status === "exceeded" && <span className="fw-bold text-danger">✗ Out of moves — try again.</span>}
            {status !== "checkmate" && (
              <span className="badge text-bg-warning rounded-0 ms-auto me-1"
                style={{ opacity: status === "stalemate" || status === "exceeded" ? 0.4 : 1 }}>
                ★ {potentialPoints} pts
              </span>
            )}
            <div className="d-flex gap-2">
              {history.length > 0 && status !== "checkmate" && !kingThinking && (
                <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={undo}>Undo</button>
              )}
              <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={() => {
                try { localStorage.removeItem(storageKey(puzzle.id)); } catch {}
                reset();
              }}>Reset</button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 240 }}>
          <div className="mb-3 d-flex align-items-center gap-2">
            <span className={`badge bg-${DIFFICULTY_COLOR[puzzle.difficulty]} rounded-0`} style={{ fontSize: 13, padding: "6px 10px" }}>
              Mate in {mateIn}
            </span>
            <strong>Puzzle #{puzzle.id}</strong>
          </div>
          <div className="d-flex gap-1 mb-3">
            {Array.from({ length: mateIn }, (_, i) => (
              <div key={i} style={{
                width: 18, height: 18, borderRadius: "50%",
                backgroundColor: i < mateIn - movesLeft ? "var(--bs-success)" : "var(--bs-secondary-bg, #444)",
                border: "1px solid #888",
              }} />
            ))}
          </div>
          <div className="small">
            <div className="fw-semibold mb-1">Rules</div>
            <ul className="ps-3 text-muted" style={{ lineHeight: 1.6 }}>
              <li>You play White.</li>
              <li>Deliver checkmate in exactly {mateIn} move{mateIn > 1 ? "s" : ""}.</li>
              <li>The black King plays its best move automatically.</li>
              <li>Stalemate counts as a loss.</li>
            </ul>
          </div>
          {history.length > 0 && (
            <div className="small mt-2">
              <div className="fw-semibold mb-1">Moves</div>
              <table className="table table-sm table-bordered mb-0" style={{ fontFamily: "", fontSize: 12 }}>
                <thead><tr><th>#</th><th>White</th><th>Black</th></tr></thead>
                <tbody>
                  {history.map((h, i) => {
                    const wFrom = `${String.fromCharCode(97 + h.whiteFrom.col)}${4 - h.whiteFrom.row}`;
                    const wTo = `${String.fromCharCode(97 + h.whiteTo.col)}${4 - h.whiteTo.row}`;
                    const bTo = h.blackTo ? `${String.fromCharCode(97 + h.blackTo.col)}${4 - h.blackTo.row}` : "…";
                    return <tr key={i}><td className="text-muted">{i + 1}</td><td>{wFrom}→{wTo}</td><td>{bTo}</td></tr>;
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
