"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Board, { type BoardPiece, type SquareStyle } from "../components/Board";
import BoardOverlay from "../components/BoardOverlay";
import PuzzleSelectDropdown from "../components/PuzzleSelectDropdown";
import { usePuzzleProgress } from "../lib/usePuzzleProgress";
import { useTimeLimit } from "../lib/useTimeLimit";
import { getLegalCaptures, applyCapture, hasAnyCapture } from "./logic";
import { saveScore } from "../lib/scores";
import { useGameSession } from "../lib/useGameSession";
import { useGamePhase } from "../lib/GameStartContext";
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
  puzzle?: PuzzleDef | null;
}

export default function SolitaireGame({ puzzle: initialPuzzle = null }: Props) {
  const { ref: boardRef, size: sq } = useResponsiveSquare(64, 8);
  const [puzzle, setPuzzle] = useState<PuzzleDef | null>(initialPuzzle);
  const { markInProgress, markCompleted: recordCompleted, getStatus } = usePuzzleProgress("chess-solitaire");
  useEffect(() => { if (puzzle) markInProgress(puzzle.id); }, [puzzle?.id]);

  const [pieces, setPieces] = useState<SolitairePiece[]>(() => initialPuzzle ? makePieces(initialPuzzle.pieces) : []);
  const [selected, setSelected] = useState<SolitairePiece | null>(null);
  const [captures, setCaptures] = useState<SolitairePiece[]>([]);
  const [history, setHistory] = useState<MoveRecord[]>([]);
  const [status, setStatus] = useState<GameStatus>("playing");
  useEffect(() => { if (status === "solved" && puzzle) recordCompleted(puzzle.id); }, [status, puzzle?.id]);
  const [lastMove, setLastMove] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null);
  const [flash, setFlash] = useState<{ row: number; col: number } | null>(null); // capture flash
  const [hintId, setHintId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("sol_completed") ?? "[]")); }
    catch { return new Set(); }
  });
  const [undoCount, setUndoCount] = useState(0);

  const { submitScore } = useGameSession("chess-solitaire", puzzle?.id ?? 0);
  const { startedAt, resetGame } = useGamePhase();
  useTimeLimit(startedAt, status === "playing", () => setStatus("timeout"));
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


  const resetPuzzle = useCallback((p: PuzzleDef) => {
    setPieces(makePieces(p.pieces));
    setSelected(null);
    setCaptures([]);
    setHistory([]);
    setStatus("playing");
    setLastMove(null);
    setFlash(null);
    setHintId(null);
    setUndoCount(0);
    setEarnedPoints(null); setRank(null);
    resetGame();
  }, [resetGame]);

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
      const pts = calcPoints(puzzle!.difficulty, pieces.length, undoCount);
      const updated = markCompleted(puzzle!.id, pts);
      setEarnedPoints(pts);
      saveScore({ puzzleId: `chess-solitaire-${puzzle!.id}`, points: pts, earnedAt: Date.now() });
      submitScore({ timeSeconds: Math.round((Date.now() - startedAt) / 1000), undoCount, totalAttempts: 1 })
        .then(({ rank: r }) => setRank(r));
      // markComplete();
      setCompleted(updated);
    } else if (!hasAnyCapture(next)) {
      setPieces(next);
      setStatus("stuck");
    } else {
      setPieces(next);
    }
  }

  function markCompleted(id: number, pts: number): Set<number> {
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
              <PuzzleSelectDropdown gameId="chess-solitaire" currentId={-1} getStatus={getStatus}
                onPuzzleLoaded={(data) => {
                  const p = data as unknown as PuzzleDef;
                  setPuzzle(p);
                  resetPuzzle(p);
                }} />
            </div>
            <div className="small">
              <div className="fw-semibold mb-1">Rules</div>
              <ul className="ps-3 text-muted" style={{ lineHeight: 1.6 }}>
                <li>Click a piece to highlight valid captures.</li>
                <li>Or drag a piece to capture.</li>
                <li>Every move must be a capture.</li>
                <li>Leave only one piece to win.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const remaining = pieces.length;
  const totalMoves = history.length;
  const potentialPts = calcPoints(puzzle.difficulty, puzzle.pieces.length, undoCount);

  return (
    <div>
      <div className="d-flex flex-column flex-md-row gap-4 align-items-center align-items-md-start" ref={boardRef}>
        {/* Board column */}
        <div>
          <BoardOverlay>
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
</BoardOverlay>

          {/* Status bar */}
          <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
            {status === "playing" && (
              <span className="text-muted small">
                {selected ? `${PIECE_NAMES[selected.type]} selected | click a highlighted piece` : "Click a piece to see captures"}
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
              <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={() => puzzle && resetPuzzle(puzzle)}>Restart</button>
            </div>
          </div>
        </div>

        {/* Info panel */}
        <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
          <div className="mb-3">
            <PuzzleSelectDropdown
              gameId="chess-solitaire"
              currentId={puzzle.id}
              getStatus={getStatus}
              onPuzzleLoaded={(data) => {
                const p = data as unknown as PuzzleDef;
                setPuzzle(p);
                resetPuzzle(p);
              }}
            />
          </div>
          <div className="mb-3 d-flex align-items-center gap-2 flex-wrap">
            <span className={`badge bg-${DIFF_COLOR[puzzle.difficulty]} rounded-0`} style={{ fontSize: 12, padding: "4px 8px" }}>
              {DIFF_LABEL[puzzle.difficulty]}
            </span>
            <strong>Puzzle #{puzzle.id}</strong>
          </div>

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
                <table className="table table-sm table-bordered mb-0" style={{ fontFamily: "", fontSize: 11 }}>
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
            {status === "playing" && (
              <div className="mt-2 d-flex align-items-center gap-2">
                <span className="text-muted">Score:</span>
                <span className="badge text-bg-warning rounded-0">★ {potentialPts} pts</span>
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
            <p className="text-muted mb-1">Puzzle #{puzzle.id}</p>
            <p className="small text-muted mb-3">Completed in {totalMoves} move{totalMoves !== 1 ? "s" : ""}</p>
            {earnedPoints !== null && (
              <div className="badge text-bg-warning rounded-0 fs-6 mb-3">+{earnedPoints} pts</div>
            )}
            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-outline-secondary rounded-0" onClick={() => puzzle && resetPuzzle(puzzle)}>Play again</button>
            </div>
          </div>
        </div>
      )}

      {/* Timeout overlay */}
      {status === "timeout" && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000 }}>
          <div className="p-4 text-center rounded-0" style={{ backgroundColor: "var(--bs-body-bg)", border: "2px solid #cc4444", minWidth: 280 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 48 }}>⏱</div>
            <h4 className="fw-bold text-danger mt-2">Time's Up</h4>
            <p className="text-muted mb-3">You exceeded the 30-minute limit.</p>
            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-danger rounded-0" onClick={() => puzzle && resetPuzzle(puzzle)}>Try again</button>
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
              <button className="btn btn-danger rounded-0" onClick={() => puzzle && resetPuzzle(puzzle)}>Restart</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
