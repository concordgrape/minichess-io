import { Chess } from "chess.js";
import { getBotMove } from "./engine";

self.onmessage = (e: MessageEvent<{ fen: string; depth: number }>) => {
  const { fen, depth } = e.data;
  const chess = new Chess(fen);
  const move = getBotMove(chess, depth);
  self.postMessage(move);
};
