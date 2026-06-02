"use client";

import { useState, useEffect, useRef } from "react";
import Board, { type BoardPiece, type SquareStyle } from "../components/Board";
import { getCaptures, spawnPawns, spawnCount, type Pawn, type Pos } from "./logic";
// Knight is the fixed piece for Survival
import { saveScore } from "../lib/scores";

const PIECE_IMAGE = "/piece-knight-white.svg";

let _id = 0;
const nextId = () => `p${_id++}`;

type Phase = "playing" | "gameover";

const STARTING_POS: Pos = { row: 1, col: 1 };
const INITIAL_PAWNS = 3;

export default function SurvivalGame() {
  const [phase, setPhase] = useState<Phase>("playing");
  const [playerPos, setPlayerPos] = useState<Pos>(STARTING_POS);
  const [pawns, setPawns] = useState<Pawn[]>([]); // populated client-side in useEffect
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [selected, setSelected] = useState(false);
  const [captures, setCaptures] = useState<Pos[]>([]);
  const [newPawns, setNewPawns] = useState<Set<string>>(new Set());
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Generate initial pawns client-side only to avoid SSR/hydration mismatch
    setPawns(spawnPawns(INITIAL_PAWNS, [], STARTING_POS, nextId));
    const stored = localStorage.getItem("survival_best");
    if (stored) setBestScore(Number(stored));
  }, []);

  function startGame() {
    _id = 0;
    setPlayerPos(STARTING_POS);
    setPawns(spawnPawns(INITIAL_PAWNS, [], STARTING_POS, nextId));
    setScore(0);
    setSelected(false);
    setCaptures([]);
    setNewPawns(new Set());
    setPhase("playing");
  }

  function handleSquareClick(row: number, col: number) {
    if (phase !== "playing") return;

    if (row === playerPos.row && col === playerPos.col) {
      if (!selected) {
        setSelected(true);
        setCaptures(getCaptures("N", playerPos, pawns));
      } else {
        setSelected(false); setCaptures([]);
      }
      return;
    }

    if (selected) {
      const isCapture = captures.some((c) => c.row === row && c.col === col);
      if (!isCapture) { setSelected(false); setCaptures([]); return; }

      const newScore = score + 1;
      const remaining = pawns.filter((p) => !(p.row === row && p.col === col));
      const newPos = { row, col };
      const spawned = spawnPawns(spawnCount(newScore), remaining, newPos, nextId);
      const afterSpawn = [...remaining, ...spawned];
      const nextCaps = getCaptures("N", newPos, afterSpawn);

      setPlayerPos(newPos);
      setPawns(afterSpawn);
      setScore(newScore);
      setSelected(false);
      setCaptures([]);
      setNewPawns(new Set(spawned.map((p) => p.id)));
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setNewPawns(new Set()), 500);

      if (nextCaps.length === 0) {
        setPhase("gameover");
        if (newScore > bestScore) {
          setBestScore(newScore);
          localStorage.setItem("survival_best", String(newScore));
          saveScore({ puzzleId: "survival", points: newScore * 10, earnedAt: Date.now() });
        }
      }
    }
  }

  function handleDrop(fromRow: number, fromCol: number, toRow: number, toCol: number) {
    if (fromRow !== playerPos.row || fromCol !== playerPos.col) return;
    const caps = getCaptures("N", playerPos, pawns);
    setSelected(true);
    setCaptures(caps);
    // Use a micro-delay so state is set before the click handler reads it
    setTimeout(() => handleSquareClick(toRow, toCol), 0);
  }

  const boardPieces: BoardPiece[] = [
    { row: playerPos.row, col: playerPos.col, code: "N", imageUrl: PIECE_IMAGE, draggable: phase === "playing" },
    ...pawns.map((p) => ({ row: p.row, col: p.col, code: "p", imageUrl: "/piece-pawn-black.svg", draggable: false })),
  ];

  const squareStyles: SquareStyle[] = [];
  if (selected) {
    squareStyles.push({ row: playerPos.row, col: playerPos.col, bg: "#7fc97f" });
    captures.forEach((c) => squareStyles.push({ row: c.row, col: c.col, ring: true }));
  }
  pawns.forEach((p) => {
    if (newPawns.has(p.id))
      squareStyles.push({ row: p.row, col: p.col, bg: (p.row + p.col) % 2 === 0 ? "#f5c842" : "#d4a017" });
  });

  const currentCaptures = phase === "playing" ? getCaptures("N", playerPos, pawns) : [];
  const spawnsNext = spawnCount(score + 1);

  return (
    <div className="d-flex flex-wrap gap-4 align-items-start">
      <div>
        <Board
          size={4}
          squareSize={88}
          pieces={boardPieces}
          squareStyles={squareStyles}
          onSquareClick={handleSquareClick}
          onDrop={handleDrop}
          interactive={phase === "playing"}
        />

        <div className="mt-2 d-flex align-items-center gap-2">
          {phase === "playing" && (
            <span className="text-muted small">
              {selected ? "Click a pawn to capture" : "Click your knight to select"}
              {" · "}
              {currentCaptures.length === 0
                ? <span className="text-danger fw-semibold">No captures!</span>
                : `${currentCaptures.length} capture${currentCaptures.length !== 1 ? "s" : ""} available`}
            </span>
          )}
          {phase === "gameover" && <span className="fw-bold text-danger">Surrounded! Game over.</span>}
          <div className="ms-auto d-flex gap-2">
            {phase === "playing" && (
              <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={startGame}>Restart</button>
            )}
            {phase === "gameover" && (
              <button className="btn btn-sm btn-outline-secondary rounded-0" onClick={startGame}>Play again</button>
            )}
          </div>
        </div>
      </div>

      <div style={{ minWidth: 180 }}>
        <div className="mb-3">
          <div className="text-muted small text-uppercase mb-1" style={{ letterSpacing: 1 }}>Score</div>
          <div className="fw-bold" style={{ fontSize: 48, lineHeight: 1 }}>{score}</div>
          <div className="text-muted small mt-1">Best: {bestScore}</div>
        </div>

        {phase === "playing" && (
          <div className="mb-3 small">
            <div className="text-muted text-uppercase mb-1" style={{ letterSpacing: 1, fontSize: 11 }}>Next spawn</div>
            <div className="fw-semibold">
              {spawnsNext} pawn{spawnsNext !== 1 ? "s" : ""}
              {score >= 15 && score < 30 && <span className="ms-1 text-warning">⚠</span>}
              {score >= 30 && <span className="ms-1 text-danger">⚠⚠</span>}
            </div>
          </div>
        )}

        {phase === "gameover" && score > 0 && (
          <div className="small text-muted mb-3 p-2 border rounded-0">
            <div className="fw-semibold mb-1">{score >= bestScore ? "🏆 New best!" : "Final score"}</div>
            <div>+{score * 10} pts added to total</div>
          </div>
        )}

        <div className="small">
          <div className="fw-semibold mb-1">How to play</div>
          <ul className="ps-3 text-muted" style={{ lineHeight: 1.7 }}>
            <li>Click your knight, then click a pawn to capture it.</li>
            <li>Or drag your knight onto a pawn.</li>
            <li>A new pawn spawns after every capture.</li>
            <li>More pawns spawn as your score grows.</li>
            <li>No captures left = game over.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
