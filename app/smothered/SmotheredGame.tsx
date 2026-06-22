"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Board as BoardType, Puzzle, GameStatus, Square } from "./types";
import { saveScore, smotheredPoints } from "../lib/scores";
import { useGameSession } from "../lib/useGameSession";
import { useGamePhase } from "../lib/GameStartContext";
import { useResponsiveSquare } from "../lib/useResponsiveSquare";
import {
  cloneBoard, findKing, isCheckmate, isStalemate, isInCheck,
  knightDeliversMate, knightCanMateNextMove,
  blackBestMove, applyKingMove, applyWhiteMove, getWhitePieceMoves,
} from "./logic";
import Board, { type BoardPiece, type SquareStyle } from "../components/Board";
import BoardOverlay from "../components/BoardOverlay";

const STORAGE_VERSION = "smothered-v1";

// mate-in-N is hardcoded by difficulty (puzzle JSON only carries id/difficulty/board).
const MATE_BY_DIFF: Record<"easy" | "medium" | "hard", number> = { easy: 2, medium: 3, hard: 4 };

const PIECE_NAMES: Record<string, string> = {
  k: "king", p: "pawn", r: "rook",
  Q: "queen", R: "rook", B: "bishop", N: "knight", K: "king", P: "pawn",
};
const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "success", medium: "warning", hard: "danger",
};

function pieceImage(code: string) {
  const color = code === code.toLowerCase() ? "black" : "white";
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

export default function SmotheredGame({ puzzles }: { puzzles: Puzzle[] }) {
  const { ref: boardRef, size: sq } = useResponsiveSquare(88, 4);
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const puzzle = puzzles[puzzleIdx];

  const { submitScore } = useGameSession("smothered", puzzle.id);
  const { startedAt, markComplete, resetGame } = useGamePhase();
  const attemptCountRef = useRef(1);
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
  const [wrongPieceFlash, setWrongPieceFlash] = useState(false);
  const isFirstRender = useRef(true);

  // Persist state on change
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (kingThinking) return;
    writeSaved({ puzzleId: puzzle.id, board, history, status, movesLeft, undoCount });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, status, movesLeft, undoCount]);

  const reset = useCallback((idx: number) => {
    const p = puzzles[idx];
    const sv = loadSaved(p.id);
    setPuzzleIdx(idx);
    setBoard(sv?.board ?? p.board.map((r) => [...r]));
    setSelected(null); setLegalSquares([]);
    setStatus(sv?.status ?? "playing");
    setMovesLeft(sv?.movesLeft ?? MATE_BY_DIFF[p.difficulty]);
    setHistory(sv?.history ?? []);
    setKingThinking(false);
    setLastMove(null);
    setUndoCount(sv?.undoCount ?? 0);
    setEarnedPoints(null); setPendingBlack(null); setWrongPieceFlash(false);
    isFirstRender.current = true;
    resetGame();
    if (puzzles[idx].id !== puzzle.id) attemptCountRef.current = 1;
    else attemptCountRef.current += 1;
  }, [puzzles, puzzle.id]);

  // Black king responds after a short delay
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
        // Check terminal after black moves
        if (isCheckmate(next)) {
          if (knightDeliversMate(next)) {
            const pts = smotheredPoints(mateIn, puzzle.difficulty, undoCount);
            saveScore({ puzzleId: `smothered-${puzzle.id}`, points: pts, earnedAt: Date.now() });
            setEarnedPoints(pts);
            submitScore({ timeSeconds: Math.round((Date.now() - startedAt) / 1000), undoCount, totalAttempts: attemptCountRef.current });
            markComplete();
            setStatus("won");
          } else {
            setStatus("lost-wrong-piece");
          }
        } else if (isStalemate(next)) {
          setStatus("lost-stalemate");
        }
      }
      setPendingBlack(null); setKingThinking(false);
    }, 300);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingBlack]);

  function applyWhiteTurn(from: Square, to: Square) {
    if (status !== "playing" || kingThinking) return;
    const boardBefore = cloneBoard(board);
    const next = applyWhiteMove(board, from, to);
    const remaining = movesLeft - 1;

    setMovesLeft(remaining);
    setHistory((h) => [...h, { whiteFrom: from, whiteTo: to, blackTo: null, boardBefore }]);
    setLastMove({ from, to });
    setSelected(null); setLegalSquares([]);

    // Check for non-knight check (orange flash warning)
    if (isInCheck(next) && !isCheckmate(next)) {
      const king = findKing(next);
      const knightDeltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      const knightCheck = knightDeltas.some(([dr, dc]) => {
        const nr = king.row + dr, nc = king.col + dc;
        return nr >= 0 && nr < 4 && nc >= 0 && nc < 4 && next[nr][nc] === "N";
      });
      if (!knightCheck) setWrongPieceFlash(true);
    }

    // Immediate terminal check (before black moves)
    if (isCheckmate(next)) {
      if (knightDeliversMate(next)) {
        const pts = smotheredPoints(mateIn, puzzle.difficulty, undoCount);
        saveScore({ puzzleId: `smothered-${puzzle.id}`, points: pts, earnedAt: Date.now() });
        setEarnedPoints(pts);
        submitScore({ timeSeconds: Math.round((Date.now() - startedAt) / 1000), undoCount, totalAttempts: attemptCountRef.current });
        markComplete();
        setBoard(next); setStatus("won");
      } else {
        setBoard(next); setStatus("lost-wrong-piece");
      }
      return;
    }
    if (isStalemate(next)) { setBoard(next); setStatus("lost-stalemate"); return; }
    if (remaining <= 0) { setBoard(next); setStatus("lost-exceeded"); return; }
    setBoard(next); setPendingBlack(next);
  }

  // Clear orange flash after 600ms
  useEffect(() => {
    if (!wrongPieceFlash) return;
    const id = setTimeout(() => setWrongPieceFlash(false), 600);
    return () => clearTimeout(id);
  }, [wrongPieceFlash]);

  function handleSquareClick(row: number, col: number) {
    if (status !== "playing" || kingThinking) return;
    const piece = board[row][col];
    if (selected) {
      const isTarget = legalSquares.some((s) => s.row === row && s.col === col);
      if (isTarget) { applyWhiteTurn(selected, { row, col }); return; }
      if (piece && piece === piece.toUpperCase()) {
        setSelected({ row, col });
        setLegalSquares(getWhitePieceMoves(board, row, col));
        return;
      }
      setSelected(null); setLegalSquares([]); return;
    }
    if (piece && piece === piece.toUpperCase()) {
      setSelected({ row, col });
      setLegalSquares(getWhitePieceMoves(board, row, col));
    }
  }

  function handleDrop(fromRow: number, fromCol: number, toRow: number, toCol: number) {
    if (status !== "playing" || kingThinking) return;
    const piece = board[fromRow][fromCol];
    if (!piece || piece !== piece.toUpperCase()) return;
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
    setStatus("playing"); setLastMove(null); setPendingBlack(null); setWrongPieceFlash(false);
  }

  const king = findKing(board);
  const kingInCheck = isInCheck(board);
  const canInteract = status === "playing" && !kingThinking;
  const moveNum = mateIn - movesLeft + 1;
  const potentialPoints = smotheredPoints(mateIn, puzzle.difficulty, undoCount);
  const knightPulse = canInteract && knightCanMateNextMove(board);

  // Build BoardPieces
  const boardPieces: BoardPiece[] = [];
  board.forEach((rowArr, row) => {
    rowArr.forEach((cell, col) => {
      if (!cell) return;
      boardPieces.push({
        row, col, code: cell,
        imageUrl: pieceImage(cell),
        draggable: canInteract && cell === cell.toUpperCase(),
      });
    });
  });

  // Build square styles
  const squareStyles: SquareStyle[] = [];

  // Last-move highlight
  if (lastMove) {
    const f = lastMove.from, t = lastMove.to;
    squareStyles.push({ row: f.row, col: f.col, bg: (f.row + f.col) % 2 === 0 ? "#cdd26a" : "#aaa23a" });
    squareStyles.push({ row: t.row, col: t.col, bg: (t.row + t.col) % 2 === 0 ? "#cdd26a" : "#aaa23a" });
  }

  // Selected piece + legal moves
  if (selected) {
    squareStyles.push({ row: selected.row, col: selected.col, bg: "#7fc97f" });
    legalSquares.forEach((s) => {
      const hasPiece = !!board[s.row][s.col];
      squareStyles.push({ row: s.row, col: s.col, ...(hasPiece ? { ring: true } : { dot: true }) });
    });
  }

  // King in check: orange if non-knight is delivering, red if knight
  if (king.row >= 0 && kingInCheck) {
    const knightDeltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    const byKnight = knightDeltas.some(([dr, dc]) => {
      const nr = king.row + dr, nc = king.col + dc;
      return nr >= 0 && nr < 4 && nc >= 0 && nc < 4 && board[nr][nc] === "N";
    });
    squareStyles.push({ row: king.row, col: king.col, bg: byKnight ? "#ff6b6b" : "#ff9900" });
  } else if (wrongPieceFlash && king.row >= 0) {
    squareStyles.push({ row: king.row, col: king.col, bg: "#ff9900" });
  }

  // Knight pulse: green glow on the knight square
  if (knightPulse) {
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        if (board[r][c] === "N") squareStyles.push({ row: r, col: c, bg: "#a8e6a8" });
  }

  const isTerminal = status !== "playing";

  return (
    <div>
      <div className="d-flex flex-wrap gap-4 align-items-start" ref={boardRef}>
        {/* Board + status bar */}
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
                {kingThinking
                  ? "King is thinking…"
                  : `Move ${moveNum} of ${mateIn} — your turn`}
                {kingInCheck && !kingThinking && (
                  <span className="ms-1 fw-semibold" style={{ color: "#ff9900" }}>· Check!</span>
                )}
                {knightPulse && !kingThinking && (
                  <span className="ms-1 text-success">· Knight in position</span>
                )}
              </span>
            )}
            {status === "won" && (
              <span className="fw-bold text-success">
                ♞ Smothered! Knight delivers the final blow.
                {earnedPoints !== null && (
                  <span className="ms-2 badge text-bg-warning rounded-0">+{earnedPoints} pts</span>
                )}
              </span>
            )}
            {status === "lost-wrong-piece" && (
              <span className="fw-bold text-danger">✗ Checkmate — but the Knight must finish it.</span>
            )}
            {status === "lost-stalemate" && (
              <span className="fw-bold text-danger">✗ Stalemate — the King escapes.</span>
            )}
            {status === "lost-exceeded" && (
              <span className="fw-bold text-danger">✗ Out of moves.</span>
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
              {history.length > 0 && status !== "won" && !kingThinking && (
                <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={undo}>Undo</button>
              )}
              <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={() => {
                localStorage.removeItem(storageKey(puzzle.id));
                const p = puzzles[puzzleIdx];
                setBoard(p.board.map((r) => [...r]));
                setSelected(null); setLegalSquares([]);
                setStatus("playing"); setMovesLeft(MATE_BY_DIFF[p.difficulty]);
                setHistory([]); setKingThinking(false);
                setLastMove(null); setUndoCount(0); setEarnedPoints(null);
                setPendingBlack(null); setWrongPieceFlash(false);
                isFirstRender.current = true;
              }}>Reset</button>
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
          <div className="mb-3 d-flex align-items-center gap-2">
            <span className={`badge bg-${DIFFICULTY_COLOR[puzzle.difficulty]} rounded-0`} style={{ fontSize: 13, padding: "6px 10px" }}>
              Mate in {mateIn}
            </span>
            <strong>Puzzle #{puzzle.id}</strong>
          </div>

          {/* Move progress dots */}
          <div className="d-flex gap-1 mb-3">
            {Array.from({ length: mateIn }, (_, i) => (
              <div key={i} style={{
                width: 18, height: 18, borderRadius: "50%",
                backgroundColor: i < mateIn - movesLeft ? "var(--bs-success)" : "var(--bs-secondary-bg, #444)",
                border: "1px solid #888",
              }} />
            ))}
          </div>

          <div className="small mb-3">
            <div className="fw-semibold mb-1">Rules</div>
            <ul className="ps-3 text-muted" style={{ lineHeight: 1.6 }}>
              <li>You play White.</li>
              <li>The black King's own pieces trap it.</li>
              <li>Deliver checkmate in {mateIn} move{mateIn > 1 ? "s" : ""}.</li>
              <li className="fw-semibold" style={{ color: "var(--bs-body-color)" }}>
                The Knight must deliver the final blow.
              </li>
              <li>Stalemate counts as a loss.</li>
            </ul>
          </div>

          {history.length > 0 && (
            <div className="small">
              <div className="fw-semibold mb-1">Moves</div>
              <table className="table table-sm table-bordered mb-0" style={{ fontSize: 12 }}>
                <thead><tr><th>#</th><th>White</th><th>Black</th></tr></thead>
                <tbody>
                  {history.map((h, i) => {
                    const sq = (s: Square) => `${String.fromCharCode(97 + s.col)}${4 - s.row}`;
                    return (
                      <tr key={i}>
                        <td className="text-muted">{i + 1}</td>
                        <td>{sq(h.whiteFrom)}→{sq(h.whiteTo)}</td>
                        <td>{h.blackTo ? sq(h.blackTo) : "…"}</td>
                      </tr>
                    );
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
