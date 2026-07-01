import { Chess } from "chess.js";
import { getBotMove } from "./engine";

self.onmessage = (e: MessageEvent<{ fen: string; depth: number; randomFraction: number }>) => {
  const { fen, depth, randomFraction } = e.data;
  const chess = new Chess(fen);
  const move = getBotMove(chess, depth, randomFraction);
  self.postMessage(move);
};
