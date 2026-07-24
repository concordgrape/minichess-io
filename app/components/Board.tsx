"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export interface BoardPiece {
  row: number;
  col: number;
  code: string;
  imageUrl: string;
  draggable?: boolean;
}

/** Human-readable alt text from a "/piece-{name}-{color}.svg" URL, e.g. "white knight". */
function pieceAlt(imageUrl: string, code: string): string {
  const m = imageUrl.match(/piece-([a-z]+)-(white|black)\.svg/i);
  return m ? `${m[2]} ${m[1]}` : code;
}

export interface SquareStyle {
  row: number;
  col: number;
  /** Override background colour */
  bg?: string;
  /** Dot overlay (empty-square legal target) */
  dot?: boolean;
  /** Ring overlay (capture target) */
  ring?: boolean;
}

export interface BoardProps {
  size?: number;        // default 8
  squareSize?: number;  // px, default 88
  pieces: BoardPiece[];
  squareStyles?: SquareStyle[];
  onSquareClick?: (row: number, col: number) => void;
  /** Called when a piece is dragged from one square to another */
  onDrop?: (fromRow: number, fromCol: number, toRow: number, toCol: number) => void;
  interactive?: boolean;
  lightColor?: string;
  darkColor?: string;
}

const LIGHT = "#f0d9b5";
const DARK  = "#b58863";

export default function Board({
  size = 8,
  squareSize = 88,
  pieces,
  squareStyles = [],
  onSquareClick,
  onDrop,
  interactive = true,
  lightColor = LIGHT,
  darkColor = DARK,
}: BoardProps) {
  const dragSrc = useRef<{ row: number; col: number } | null>(null);
  const [dragOver, setDragOver] = useState<{ row: number; col: number } | null>(null);

  return (
    <div
      style={{
        display: "inline-grid",
        gridTemplateColumns: `repeat(${size}, ${squareSize}px)`,
        gridTemplateRows: `repeat(${size}, ${squareSize}px)`,
        border: "2px solid #555",
        userSelect: "none",
        lineHeight: 0,
      }}
    >
      {Array.from({ length: size }, (_, row) =>
        Array.from({ length: size }, (_, col) => {
          const piece = pieces.find((p) => p.row === row && p.col === col);
          const style = squareStyles.find((s) => s.row === row && s.col === col);
          const light = (row + col) % 2 === 0;
          const isDragOver = dragOver?.row === row && dragOver?.col === col;
          const isLegalDragTarget = isDragOver && (style?.dot || style?.ring);

          let bg = style?.bg ?? (light ? lightColor : darkColor);
          if (isLegalDragTarget) bg = light ? "#cdd26a" : "#aaa23a";

          const canDrag = interactive && !!piece?.draggable;

          return (
            <div
              key={`${row}-${col}`}
              onClick={() => interactive && onSquareClick?.(row, col)}
              onDragOver={(e) => { if (interactive) { e.preventDefault(); setDragOver({ row, col }); } }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => {
                setDragOver(null);
                if (!interactive || !dragSrc.current) return;
                onDrop?.(dragSrc.current.row, dragSrc.current.col, row, col);
                dragSrc.current = null;
              }}
              style={{
                width: squareSize, height: squareSize,
                backgroundColor: bg,
                position: "relative",
                display: "block",
                overflow: "hidden",
                cursor: interactive ? (canDrag ? "grab" : "pointer") : "default",
              }}
            >
              {/* Rank label */}
              {col === 0 && (
                <span style={{
                  position: "absolute", top: 2, left: 4,
                  fontSize: 10, fontWeight: "bold",
                  color: light ? darkColor : lightColor,
                  pointerEvents: "none", zIndex: 3,
                }}>{size - row}</span>
              )}
              {/* File label */}
              {row === size - 1 && (
                <span style={{
                  position: "absolute", bottom: 2, right: 4,
                  fontSize: 10, fontWeight: "bold",
                  color: light ? darkColor : lightColor,
                  pointerEvents: "none", zIndex: 3,
                }}>{String.fromCharCode(97 + col)}</span>
              )}

              {/* Legal move dot */}
              {style?.dot && (
                <div style={{
                  position: "absolute",
                  top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: squareSize * 0.28, height: squareSize * 0.28,
                  borderRadius: "50%",
                  backgroundColor: "rgba(0,0,0,0.2)",
                  pointerEvents: "none", zIndex: 1,
                }} />
              )}

              {/* Capture ring */}
              {style?.ring && (
                <div style={{
                  position: "absolute", inset: 3,
                  border: "3px solid rgba(0,0,0,0.28)",
                  borderRadius: "50%",
                  pointerEvents: "none", zIndex: 1,
                }} />
              )}

              {/* Piece */}
              {piece && (
                <Image
                  src={piece.imageUrl}
                  alt={pieceAlt(piece.imageUrl, piece.code)}
                  width={squareSize - 8}
                  height={squareSize - 8}
                  draggable={canDrag}
                  onDragStart={() => { if (canDrag) dragSrc.current = { row, col }; }}
                  onDragEnd={() => { setDragOver(null); dragSrc.current = null; }}
                  style={{
                    position: "absolute", top: 4, left: 4,
                    display: "block",
                    cursor: canDrag ? "grab" : "default",
                    pointerEvents: canDrag ? "auto" : "none",
                    zIndex: 2,
                  }}
                  priority
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
