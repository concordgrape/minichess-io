import { bestDefense } from "./engine";

self.onmessage = (e: MessageEvent<{ fen: string; horizonPlies: number }>) => {
  const { fen, horizonPlies } = e.data;
  const move = bestDefense(fen, horizonPlies);
  self.postMessage(move);
};
