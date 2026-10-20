import type { Board } from "./types";
import { getBestMove } from "./logic";

self.onmessage = (e: MessageEvent<{ board: Board; depth: number; randomFraction: number }>) => {
  const { board, depth, randomFraction } = e.data;
  const move = getBestMove(board, depth, randomFraction);
  self.postMessage(move);
};
