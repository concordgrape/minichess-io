"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Chess, type Square, type Move, type PieceSymbol, type Color } from "chess.js";
import Board, { type BoardPiece, type SquareStyle } from "../components/Board";
import BoardOverlay from "../components/BoardOverlay";
import { useResponsiveSquare } from "../lib/useResponsiveSquare";
import { saveScore, matePoints } from "../lib/scores";
import { useGameSession } from "../lib/useGameSession";
import { useGamePhase } from "../lib/GameStartContext";
import PuzzleSelectDropdown from "../components/PuzzleSelectDropdown";
import { usePuzzleProgress } from "../lib/usePuzzleProgress";
import { useTimeLimit } from "../lib/useTimeLimit";
import type { MatePuzzle, GameStatus } from "./types";

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

export default function MateGame({
  puzzle: initialPuzzle = null,
  mateIn,
  slug,
}: {
  puzzle?: MatePuzzle | null;
  mateIn: number;
  /** Route slug used to namespace saved scores (e.g. "mate-in-2"). */
  slug: string;
}) {
  const [puzzle, setPuzzle] = useState<MatePuzzle | null>(initialPuzzle);
  const { markInProgress, markCompleted, getStatus } = usePuzzleProgress(slug);
  useEffect(() => { if (puzzle) markInProgress(puzzle.id); }, [puzzle?.id]);
  const player: Color = "w";
  const { ref: boardRef, size: sq } = useResponsiveSquare(64, 8);

  const { submitScore } = useGameSession(slug as import("../lib/scoring/types").GameId, puzzle?.id ?? 0);
  const { startedAt, resetGame } = useGamePhase();
  const invalidateLb = useRef<(() => void) | null>(null);

  const [chess] = useState(() => new Chess(initialPuzzle?.fen ?? "4k3/8/8/8/8/8/8/4K3 w - - 0 1"));
  const [board, setBoard] = useState(() => initialPuzzle ? chess.board() : []);
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [status, setStatus] = useState<GameStatus>("playing");
  useTimeLimit(startedAt, status === "playing", () => setStatus("timeout"));
  useEffect(() => { if (status === "solved" && puzzle) markCompleted(puzzle.id); }, [status, puzzle?.id]);
  const [movesLeft, setMovesLeft] = useState(mateIn);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [defending, setDefending] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [defenseTrigger, setDefenseTrigger] = useState(0);
  const pendingDefense = useRef(false);

  const refresh = useCallback(() => {
    setBoard([...chess.board()]);
  }, [chess]);

  const load = useCallback((p: MatePuzzle) => {
    chess.load(p.fen);
    setBoard([...chess.board()]);
    setSelected(null); setLegalMoves([]);
    setStatus("playing"); setMovesLeft(mateIn);
    setLastMove(null); setDefending(false);
    setUndoCount(0); setEarnedPoints(null); setRank(null);
    pendingDefense.current = false;
    resetGame();
  }, [chess, mateIn, resetGame]);

  async function award() {
    const pts = matePoints(mateIn, puzzle!.difficulty, undoCount);
    saveScore({ puzzleId: `${slug}-${puzzle!.id}`, points: pts, earnedAt: Date.now() });
    setEarnedPoints(pts);
    setStatus("solved");
    invalidateLb.current?.();
    const { rank: r } = await submitScore({ timeSeconds: Math.round((Date.now() - startedAt) / 1000), undoCount, totalAttempts: 1 });
    setRank(r);
  }

  // Defender (Black) reply, computed off the main thread.
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
      if (chess.isStalemate()) setStatus("stalemate");
      setDefending(false);
      worker.terminate();
    };
    return () => worker.terminate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defenseTrigger]);

  function applyMove(from: Square, to: Square) {
    const piece = chess.get(from);
    const promotion = piece?.type === "p" && (to[1] === "8" || to[1] === "1") ? "q" : undefined;
    try { chess.move({ from, to, promotion }); } catch { return; }
    const remaining = movesLeft - 1;
    setMovesLeft(remaining);
    setLastMove({ from, to });
    setSelected(null); setLegalMoves([]);
    refresh();

    if (chess.isCheckmate()) { award(); return; }
    if (chess.isStalemate()) { setStatus("stalemate"); return; }
    if (remaining <= 0) { setStatus("exceeded"); return; }
    // Hand off to the defender.
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
    // Undo the defender's reply (if any) and the player's move.
    if (chess.turn() === player) chess.undo();
    chess.undo();
    setMovesLeft((m) => Math.min(mateIn, m + 1));
    setUndoCount((n) => n + 1);
    setSelected(null); setLegalMoves([]);
    setStatus("playing"); setLastMove(null); setEarnedPoints(null);
    pendingDefense.current = false;
    refresh();
  }

  const inCheck = chess.inCheck();
  if (!puzzle) {
    return (
      <div>
        <div className="d-flex flex-column flex-md-row gap-4 align-items-center align-items-md-start" ref={boardRef}>
          <div>
            <BoardOverlay ready={false}>
              <Board size={8} squareSize={sq} pieces={[]} squareStyles={[]} onSquareClick={() => {}} onDrop={() => {}} interactive={false} />
            </BoardOverlay>
          </div>
          <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
            <div className="mb-3">
              <PuzzleSelectDropdown gameId={slug} currentId={-1} getStatus={getStatus} invalidateLbRef={invalidateLb}
                onPuzzleLoaded={(data) => { const p = data as unknown as MatePuzzle; setPuzzle(p); load(p); }} />
            </div>
            <div className="small">
              <div className="fw-semibold mb-1">Rules</div>
              <ul className="ps-3 text-muted" style={{ lineHeight: 1.6 }}>
                <li>You play White.</li>
                <li>Deliver checkmate in {mateIn} move{mateIn > 1 ? "s" : ""}.</li>
                <li>Black always plays its best defense.</li>
                <li>Stalemate counts as a loss.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canInteract = status === "playing" && !defending;
  const history = chess.history();
  const moveNum = mateIn - movesLeft + 1;
  const potentialPoints = matePoints(mateIn, puzzle.difficulty, undoCount);

  // Build Board props
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
  if (inCheck) {
    for (const row of chess.board())
      for (const cell of row)
        if (cell?.type === "k" && cell.color === chess.turn()) {
          squareStyles.push({ ...sqToRowCol(cell.square as Square), bg: "#ff6b6b" });
        }
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row gap-4 align-items-center align-items-md-start" ref={boardRef}>
        <div>
          <BoardOverlay>
<Board
            size={8}
            squareSize={sq}
            pieces={pieces}
            squareStyles={squareStyles}
            onSquareClick={handleSquareClick}
            onDrop={handleDrop}
            interactive={canInteract}
          />
</BoardOverlay>

          <div className="mt-2 d-flex align-items-center gap-2" style={{ minHeight: 32 }}>
            {status === "playing" && (
              <span className="text-muted small">
                {defending ? "Black is defending…" : `Move ${moveNum} of ${mateIn} | your turn`}
                {inCheck && !defending && " · Check!"}
              </span>
            )}
            {status === "solved" && (
              <span className="fw-bold text-success">
                ✓ Checkmate! Puzzle solved.
                {earnedPoints !== null && <span className="ms-2 badge text-bg-warning rounded-0">+{earnedPoints} pts</span>}
              </span>
            )}
            {status === "stalemate" && <span className="fw-bold text-danger">✗ Stalemate | try again.</span>}
            {status === "exceeded" && <span className="fw-bold text-danger">✗ Out of moves | try again.</span>}
            {status !== "solved" && (
              <span className="badge text-bg-warning rounded-0 ms-auto me-1"
                style={{ opacity: status === "playing" ? 1 : 0.4 }}>
                ★ {potentialPoints} pts
              </span>
            )}
            <div className="d-flex gap-2">
              {history.length > 0 && status !== "solved" && !defending && (
                <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={undo}>Undo</button>
              )}
              <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={() => load(puzzle)}>Reset</button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
          <div className="mb-3">
            <PuzzleSelectDropdown
              gameId={slug}
              currentId={puzzle.id}
              getStatus={getStatus}
              invalidateLbRef={invalidateLb}
              onPuzzleLoaded={(data) => {
                const p = data as unknown as MatePuzzle;
                setPuzzle(p);
                load(p);
              }}
            />
          </div>
          <div className="mb-3 d-flex align-items-center gap-2">
            <span className={`badge bg-${DIFFICULTY_COLOR[puzzle.difficulty]} rounded-0`} style={{ fontSize: 13, padding: "6px 10px" }}>
              {puzzle.difficulty}
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
              <li>Deliver checkmate in {mateIn} move{mateIn > 1 ? "s" : ""}.</li>
              <li>Black always plays its best defense.</li>
              <li>Stalemate counts as a loss.</li>
            </ul>
            {status === "playing" && (
              <div className="mt-2 d-flex align-items-center gap-2">
                <span className="text-muted">Score:</span>
                <span className="badge text-bg-warning rounded-0">★ {potentialPoints} pts</span>
                {undoCount > 0 && <span className="text-muted">({undoCount} undo{undoCount > 1 ? "s" : ""})</span>}
              </div>
            )}
            {status === "solved" && earnedPoints !== null && (
              <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
                <span className="badge text-bg-warning rounded-0">★ {earnedPoints} pts earned</span>
                {rank !== null
                  ? <span className="text-muted">#{rank} on the leaderboard</span>
                  : <span className="text-muted" style={{ fontSize: 11 }}>Submitting…</span>}
              </div>
            )}
          </div>
          {history.length > 0 && (
            <div className="small mt-2">
              <div className="fw-semibold mb-1">Moves</div>
              <table className="table table-sm table-bordered mb-0" style={{ fontFamily: "", fontSize: 12 }}>
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

      {status === "timeout" && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000 }}>
          <div className="p-4 text-center rounded-0" style={{ backgroundColor: "var(--bs-body-bg)", border: "2px solid #cc4444", minWidth: 280 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 48 }}>⏱</div>
            <h4 className="fw-bold text-danger mt-2">Time's Up</h4>
            <p className="text-muted mb-3">You exceeded the 30-minute limit.</p>
            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-danger rounded-0" onClick={() => puzzle && load(puzzle)}>Try again</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
