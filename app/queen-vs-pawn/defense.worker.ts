import { bestPawnDefense } from "./engine";

self.onmessage = (e: MessageEvent<{ fen: string; horizonPlies: number }>) => {
  const { fen, horizonPlies } = e.data;
  const move = bestPawnDefense(fen, horizonPlies);
  self.postMessage(move);
};
