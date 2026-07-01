"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Board as BoardType, DailyPosition, GameStatus, Move, MoveRecord, Turn, SavedGame } from "./types";
import {
  cloneBoard, applyMove, getMovesForSquare, getLegalMoves, getBestMove,
  isInCheck, isCheckmate, isStalemate, isInsufficientMaterial,
  moveNotation, squareName, SIZE,
} from "./logic";
import Board, { type BoardPiece, type SquareStyle } from "../components/Board";
import { useResponsiveSquare } from "../lib/useResponsiveSquare";

const STORAGE_VERSION = "minichess-v1";
const SQ = 75; // max square size px (shrinks to fit on mobile)

const PIECE_NAMES: Record<string, string> = {
  k: "king", q: "queen", r: "rook", n: "knight", b: "bishop", p: "pawn",
};
const PIECE_SYMBOL: Record<string, string> = {
  k: "♚", q: "♛", r: "♜", n: "♞", b: "♝", p: "♟",
};

function pieceImage(code: string): string {
  const color = code === code.toUpperCase() ? "white" : "black";
  return `/piece-${PIECE_NAMES[code.toLowerCase()]}-${color}.svg`;
}

function storageKey(positionId: number) { return `${STORAGE_VERSION}-${positionId}`; }

function loadSaved(positionId: number): SavedGame | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(positionId));
    if (!raw) return null;
    const s: SavedGame = JSON.parse(raw);
    return s.positionId === positionId ? s : null;
  } catch { return null; }
}

function writeSaved(state: SavedGame) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(storageKey(state.positionId), JSON.stringify(state)); } catch { /* ignore */ }
}

export default function MiniChessGame({ position }: { position: DailyPosition }) {
  const { ref: boardRef, size: sq } = useResponsiveSquare(SQ, SIZE);
  const saved = typeof window !== "undefined" ? loadSaved(position.id) : null;

  const [board, setBoard] = useState<BoardType>(() => saved?.board ?? position.board.map((r) => [...r]));
  const [turn, setTurn] = useState<Turn>(() => saved?.turn ?? "white");
  const [status, setStatus] = useState<GameStatus>(() => saved?.status ?? "playing");
  const [history, setHistory] = useState<MoveRecord[]>(() => saved?.history ?? []);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [movesForSel, setMovesForSel] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [pendingAI, setPendingAI] = useState<BoardType | null>(null);
  const [reviewIdx, setReviewIdx] = useState<number | null>(null);
  const isFirstRender = useRef(true);
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Persist
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    writeSaved({ positionId: position.id, board, history, turn, status });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, turn, status]);

  // Auto-scroll history
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [history.length]);

  // AI move after white plays
  useEffect(() => {
    if (!pendingAI) return;
    setAiThinking(true);
    const id = setTimeout(() => {
      const move = getBestMove(pendingAI);
      if (move) {
        const next = applyMove(pendingAI, move);
        const notation = moveNotation(pendingAI, move);
        const record: MoveRecord = { move, boardAfter: next, notation, turn: "black" };
        setBoard(next);
        setHistory((h) => [...h, record]);
        setLastMove({ from: move.from, to: move.to });

        if (isCheckmate(next, true)) { setStatus("lost"); }
        else if (isStalemate(next, true)) { setStatus("draw-stalemate"); }
        else if (isInsufficientMaterial(next)) { setStatus("draw-insufficient"); }
        else { setTurn("white"); }
      } else {
        // Black has no moves
        if (isInCheck(pendingAI, false)) { setStatus("won"); }
        else { setStatus("draw-stalemate"); }
      }
      setPendingAI(null);
      setAiThinking(false);
    }, 300);
    return () => clearTimeout(id);
  }, [pendingAI]);

  const executeWhiteMove = useCallback((move: Move) => {
    const next = applyMove(board, move);
    const notation = moveNotation(board, move);
    const record: MoveRecord = { move, boardAfter: next, notation, turn: "white" };
    setBoard(next);
    setHistory((h) => [...h, record]);
    setLastMove({ from: move.from, to: move.to });
    setSelected(null);
    setMovesForSel([]);

    if (isCheckmate(next, false)) { setStatus("won"); }
    else if (isStalemate(next, false)) { setStatus("draw-stalemate"); }
    else if (isInsufficientMaterial(next)) { setStatus("draw-insufficient"); }
    else { setTurn("black"); setPendingAI(next); }
  }, [board]);

  function handleSquareClick(row: number, col: number) {
    if (reviewIdx !== null || aiThinking || turn !== "white" || status !== "playing") return;

    // Click a legal target
    if (selected) {
      const target = movesForSel.find((m) => m.to.row === row && m.to.col === col);
      if (target) { executeWhiteMove(target); return; }
    }

    const piece = board[row][col];
    if (piece && piece === piece.toUpperCase()) {
      // Select white piece
      if (selected?.row === row && selected?.col === col) {
        setSelected(null); setMovesForSel([]); return;
      }
      const moves = getMovesForSquare(board, row, col);
      setSelected({ row, col });
      setMovesForSel(moves);
    } else {
      setSelected(null); setMovesForSel([]);
    }
  }

  function handleDrop(fromRow: number, fromCol: number, toRow: number, toCol: number) {
    if (reviewIdx !== null || aiThinking || turn !== "white" || status !== "playing") return;
    const p = board[fromRow][fromCol];
    if (!p || p !== p.toUpperCase()) return;
    const moves = getMovesForSquare(board, fromRow, fromCol);
    const target = moves.find((m) => m.to.row === toRow && m.to.col === toCol);
    if (target) executeWhiteMove(target);
  }

  function restartGame() {
    localStorage.removeItem(storageKey(position.id));
    const fresh = position.board.map((r) => [...r]);
    setBoard(fresh); setTurn("white"); setStatus("playing");
    setHistory([]); setSelected(null); setMovesForSel([]);
    setLastMove(null); setAiThinking(false); setPendingAI(null);
    setReviewIdx(null);
    isFirstRender.current = true;
  }

  // ── Derived display state ───────────────────────────────────────────────────
  const isReview = reviewIdx !== null;
  const displayBoard = isReview ? history[reviewIdx].boardAfter : board;
  const canInteract = !isReview && turn === "white" && status === "playing" && !aiThinking;
  const inCheck = status === "playing" && !aiThinking && !isReview && isInCheck(board, turn === "white");

  // Board pieces
  const boardPieces: BoardPiece[] = [];
  displayBoard.forEach((rowArr, row) => {
    rowArr.forEach((cell, col) => {
      if (!cell) return;
      boardPieces.push({
        row, col, code: cell,
        imageUrl: pieceImage(cell),
        draggable: canInteract && isWhiteCode(cell),
      });
    });
  });

  function isWhiteCode(c: string) { return c === c.toUpperCase(); }

  // Square styles
  const squareStyles: SquareStyle[] = [];
  const lm = isReview ? null : lastMove;
  if (lm) {
    const light = (r: number, c: number) => (r + c) % 2 === 0;
    squareStyles.push({ row: lm.from.row, col: lm.from.col, bg: light(lm.from.row, lm.from.col) ? "#cdd26a" : "#aaa23a" });
    squareStyles.push({ row: lm.to.row, col: lm.to.col, bg: light(lm.to.row, lm.to.col) ? "#cdd26a" : "#aaa23a" });
  }
  if (selected && !isReview) {
    squareStyles.push({ row: selected.row, col: selected.col, bg: "#7fc97f" });
    movesForSel.forEach((m) => {
      squareStyles.push({ row: m.to.row, col: m.to.col, ...(m.capture ? { ring: true } : { dot: true }) });
    });
  }
  // Check flash
  if (inCheck && !isReview) {
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        if (displayBoard[r][c] === (turn === "white" ? "K" : "k"))
          squareStyles.push({ row: r, col: c, bg: "#ff6b6b" });
  }

  // ── Move history pairs ───────────────────────────────────────────────────────
  const pairs: [MoveRecord | null, MoveRecord | null][] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push([history[i] ?? null, history[i + 1] ?? null]);
  }

  // Status message
  const statusMsg =
    status === "won" ? "Checkmate | you win! 🎉" :
    status === "lost" ? "Checkmate | you lose" :
    status === "draw-stalemate" ? "Stalemate | draw" :
    status === "draw-insufficient" ? "Draw | insufficient material" :
    null;

  return (
    <div>
      <div className="d-flex flex-column flex-md-row gap-4 align-items-center align-items-md-start" ref={boardRef}>
        {/* Board column */}
        <div>
          {/* Orientation label */}
          <div className="d-flex justify-content-between mb-1 px-1" style={{ width: SIZE * sq }}>
            <span className="small text-muted">
              {aiThinking ? <span>⏳ AI thinking<span className="ms-1" style={{ letterSpacing: 2 }}>…</span></span>
                : isReview ? <span className="text-warning small">Review mode | <button className="btn btn-sm btn-outline-warning rounded-0 py-0 px-1" onClick={() => setReviewIdx(null)}>Resume</button></span>
                : status === "playing" ? <span>{turn === "white" ? "♟ Your turn (White)" : "⏳ Black thinking…"}</span>
                : null}
            </span>
            {inCheck && <span className="small fw-bold text-danger">Check!</span>}
          </div>

          <Board
            size={SIZE}
            squareSize={sq}
            pieces={boardPieces}
            squareStyles={squareStyles}
            onSquareClick={handleSquareClick}
            onDrop={handleDrop}
            interactive={canInteract}
          />

          {/* Status bar */}
          <div className="mt-2 d-flex align-items-center gap-2 flex-wrap" style={{ width: SIZE * sq }}>
            {statusMsg && (
              <span className={`fw-bold ${status === "won" ? "text-success" : "text-danger"}`}>
                {statusMsg}
              </span>
            )}
            <div className="ms-auto d-flex gap-2">
              {isReview && (
                <button className="btn btn-sm btn-outline-warning rounded-0" onClick={() => setReviewIdx(null)}>
                  Resume live
                </button>
              )}
              {status !== "playing" && (
                <button className="btn btn-sm btn-success rounded-0" onClick={restartGame}>New game</button>
              )}
              <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={restartGame}>Restart</button>
            </div>
          </div>
        </div>

        {/* Move history & info */}
        <div style={{ minWidth: 200, maxWidth: 260 }}>
          <div className="fw-semibold mb-2 small text-uppercase" style={{ letterSpacing: 1 }}>Moves</div>

          {pairs.length === 0 && (
            <p className="text-muted small">No moves yet.</p>
          )}

          <div style={{ maxHeight: 340, overflowY: "auto", fontSize: 13, fontFamily: "monospace" }}>
            <table className="table table-sm table-bordered mb-0">
              <thead>
                <tr>
                  <th style={{ width: 28 }}>#</th>
                  <th>White</th>
                  <th>Black</th>
                </tr>
              </thead>
              <tbody>
                {pairs.map(([w, b], pairIdx) => {
                  const wIdx = pairIdx * 2;
                  const bIdx = pairIdx * 2 + 1;
                  return (
                    <tr key={pairIdx}>
                      <td className="text-muted">{pairIdx + 1}</td>
                      <td>
                        {w && (
                          <button
                            onClick={() => setReviewIdx(wIdx)}
                            className={`btn btn-sm rounded-0 p-0 px-1 w-100 text-start ${reviewIdx === wIdx ? "btn-warning" : "btn-link text-body"}`}
                          >
                            {w.notation}
                          </button>
                        )}
                      </td>
                      <td>
                        {b && (
                          <button
                            onClick={() => setReviewIdx(bIdx)}
                            className={`btn btn-sm rounded-0 p-0 px-1 w-100 text-start ${reviewIdx === bIdx ? "btn-warning" : "btn-link text-body"}`}
                          >
                            {b.notation}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div ref={historyEndRef} />
          </div>

          <div className="mt-3 small">
            <div className="fw-semibold mb-1">Mini Chess</div>
            <ul className="ps-3 text-muted" style={{ lineHeight: 1.6 }}>
              <li>5×5 board, no castling.</li>
              <li>Pawns promote to Queen.</li>
              <li>Checkmate to win.</li>
              <li>Click any move to review it.</li>
            </ul>
          </div>

          {/* Material count */}
          <div className="mt-2 small">
            <div className="fw-semibold mb-1">Material</div>
            <MaterialCount board={board} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Shows captured piece symbols for quick material assessment. */
function MaterialCount({ board }: { board: BoardType }) {
  const pieces: Record<string, number> = {};
  board.forEach((row) => row.forEach((p) => { if (p) pieces[p] = (pieces[p] ?? 0) + 1; }));

  const whitePieces = ["K","Q","R","N","B","P"].filter((p) => pieces[p]);
  const blackPieces = ["k","q","r","n","b","p"].filter((p) => pieces[p]);

  return (
    <div className="d-flex flex-column gap-1">
      <div className="d-flex align-items-center gap-1">
        <span className="text-muted me-1" style={{ fontSize: 11 }}>W</span>
        {whitePieces.map((p) => (
          <span key={p} style={{ fontSize: 14 }}>
            {PIECE_SYMBOL[p.toLowerCase()]}
            {pieces[p] > 1 && <sup style={{ fontSize: 9 }}>{pieces[p]}</sup>}
          </span>
        ))}
      </div>
      <div className="d-flex align-items-center gap-1">
        <span className="text-muted me-1" style={{ fontSize: 11 }}>B</span>
        {blackPieces.map((p) => (
          <span key={p} style={{ fontSize: 14 }}>
            {PIECE_SYMBOL[p.toLowerCase()]}
            {pieces[p] > 1 && <sup style={{ fontSize: 9 }}>{pieces[p]}</sup>}
          </span>
        ))}
      </div>
    </div>
  );
}
