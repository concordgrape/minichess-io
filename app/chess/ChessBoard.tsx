"use client";

import { useState, useEffect, useCallback } from "react";
import { Chess, type Square, type Move, type PieceSymbol, type Color } from "chess.js";
import Board, { type BoardPiece, type SquareStyle } from "../components/Board";
import { useResponsiveSquare } from "../lib/useResponsiveSquare";

const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king",
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

type GameStatus = "playing" | "checkmate" | "draw" | "stalemate";

const DIFFICULTIES = [
  { label: "Newborn",   rating: "~300",  depth: 1 },
  { label: "Club Kid",  rating: "~800",  depth: 2 },
  { label: "Patzer",    rating: "~1200", depth: 3 },
  { label: "Hustler",   rating: "~1600", depth: 4 },
  { label: "The Beast", rating: "~2000", depth: 5 },
];

const PLAYER: Color = "w";

export default function ChessBoard() {
  const [chess] = useState(() => new Chess());
  const [board, setBoard] = useState(() => chess.board());
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [check, setCheck] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [botThinking, setBotThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState(2);
  const [turnTrigger, setTurnTrigger] = useState(0);
  const { ref: rootRef, size: squareSize } = useResponsiveSquare(64, 8);

  const refresh = useCallback(() => {
    setBoard([...chess.board()]);
    setCheck(chess.inCheck());
    if (chess.isCheckmate()) setStatus("checkmate");
    else if (chess.isStalemate()) setStatus("stalemate");
    else if (chess.isDraw()) setStatus("draw");
    else setStatus("playing");
    setMoveHistory(chess.history());
  }, [chess]);

  useEffect(() => {
    if (chess.turn() === PLAYER || chess.isGameOver()) return;
    setBotThinking(true);
    const worker = new Worker(new URL("./engine.worker.ts", import.meta.url));
    worker.postMessage({ fen: chess.fen(), depth: DIFFICULTIES[difficulty].depth });
    worker.onmessage = (e) => {
      const move = e.data;
      if (move) { chess.move(move); setLastMove({ from: move.from, to: move.to }); }
      refresh(); setBotThinking(false); worker.terminate();
    };
    return () => worker.terminate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnTrigger]);

  function applyMove(from: Square, to: Square) {
    const piece = chess.get(from);
    const promotion = piece?.type === "p" && (to[1] === "8" || to[1] === "1") ? "q" : undefined;
    try { chess.move({ from, to, promotion }); } catch { return false; }
    setLastMove({ from, to });
    setSelected(null); setLegalMoves([]);
    refresh(); setTurnTrigger((n) => n + 1);
    return true;
  }

  function handleSquareClick(row: number, col: number) {
    if (status !== "playing" || chess.turn() !== PLAYER || botThinking) return;
    const sq = rowColToSq(row, col);
    if (selected) {
      if (legalMoves.includes(sq)) { applyMove(selected, sq); return; }
    }
    const piece = chess.get(sq);
    if (piece && piece.color === PLAYER) {
      setSelected(sq);
      setLegalMoves((chess.moves({ square: sq, verbose: true }) as Move[]).map((m) => m.to as Square));
    } else { setSelected(null); setLegalMoves([]); }
  }

  function handleDrop(fromRow: number, fromCol: number, toRow: number, toCol: number) {
    if (status !== "playing" || chess.turn() !== PLAYER || botThinking) return;
    applyMove(rowColToSq(fromRow, fromCol), rowColToSq(toRow, toCol));
  }

  function changeDifficulty(idx: number) {
    setDifficulty(idx); chess.reset();
    setSelected(null); setLegalMoves([]); setLastMove(null);
    setStatus("playing"); setMoveHistory([]); setBotThinking(false); refresh();
  }

  function undoLastMove() {
    chess.undo(); chess.undo();
    setSelected(null); setLegalMoves([]); setLastMove(null); refresh();
  }

  function resetGame() {
    chess.reset(); setSelected(null); setLegalMoves([]); setLastMove(null);
    setStatus("playing"); setMoveHistory([]); setBotThinking(false); refresh();
  }

  // Build Board props
  const canInteract = status === "playing" && chess.turn() === PLAYER && !botThinking;

  const pieces: BoardPiece[] = [];
  board.forEach((rowArr, row) => {
    rowArr.forEach((cell, col) => {
      if (!cell) return;
      pieces.push({
        row, col,
        code: `${cell.color}${cell.type}`,
        imageUrl: pieceImage(cell.type, cell.color),
        draggable: canInteract && cell.color === PLAYER,
      });
    });
  });

  const squareStyles: SquareStyle[] = [];
  const checkedKingPos = (() => {
    if (!check) return null;
    for (const row of chess.board())
      for (const cell of row)
        if (cell?.type === "k" && cell.color === chess.turn()) return sqToRowCol(cell.square as Square);
    return null;
  })();

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
      const hasCapture = !!chess.get(sq);
      squareStyles.push({ ...pos, ...(hasCapture ? { ring: true } : { dot: true }) });
    });
  }
  if (checkedKingPos) squareStyles.push({ ...checkedKingPos, bg: "#ff6b6b" });

  return (
    <div className="d-flex gap-4 flex-wrap" ref={rootRef}>
      <div>
        <Board
          size={8}
          squareSize={squareSize}
          pieces={pieces}
          squareStyles={squareStyles}
          onSquareClick={handleSquareClick}
          onDrop={handleDrop}
          interactive={canInteract}
        />

        <div className="mt-2 d-flex align-items-center gap-2">
          {status === "playing" && (
            <>
              <span className="text-muted small">
                {botThinking ? "Bot is thinking…" : chess.turn() === PLAYER ? "Your turn" : "Bot's turn"}
                {check && " — Check!"}
              </span>
              {chess.turn() === PLAYER && moveHistory.length >= 2 && !botThinking && (
                <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={undoLastMove}>Undo</button>
              )}
            </>
          )}
          {status === "checkmate" && (
            <span className="fw-bold text-danger">Checkmate — {chess.turn() === PLAYER ? "Bot wins!" : "You win!"}</span>
          )}
          {status === "stalemate" && <span className="fw-bold text-warning">Stalemate — Draw!</span>}
          {status === "draw" && <span className="fw-bold text-warning">Draw!</span>}
          <button className="btn btn-sm btn-outline-secondary rounded-0 ms-auto" onClick={resetGame}>New game</button>
        </div>
      </div>

      {/* Right panel: difficulty + move history */}
      <div style={{ minWidth: 200 }}>
        <div className="d-flex align-items-center gap-2 mb-2">
          <label className="text-muted small mb-0">Difficulty:</label>
          <select
            className="form-select form-select-sm rounded-0 w-100"
            value={difficulty}
            onChange={(e) => changeDifficulty(Number(e.target.value))}
          >
            {DIFFICULTIES.map((d, i) => (
              <option key={i} value={i}>{d.label} ({d.rating} ELO)</option>
            ))}
          </select>
        </div>
        <div style={{ maxHeight: 480, overflowY: "auto" }}>
        <table className="table table-sm table-bordered mb-0" style={{ fontFamily: "", fontSize: 13 }}>
          <colgroup><col style={{ width: 36 }} /><col style={{ width: 80 }} /><col style={{ width: 80 }} /></colgroup>
          <thead className="table-light sticky-top"><tr><th>#</th><th>White</th><th>Black</th></tr></thead>
          <tbody>
            {moveHistory.length === 0 && <tr><td colSpan={3} className="text-muted">No moves yet</td></tr>}
            {Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => (
              <tr key={i}>
                <td className="text-muted">{i + 1}</td>
                <td>{moveHistory[i * 2]}</td>
                <td>{moveHistory[i * 2 + 1] ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
