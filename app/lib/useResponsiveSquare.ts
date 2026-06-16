"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Shrinks a board's square size to fit narrow (mobile) viewports.
 * Attach the returned `ref` to a full-width container (e.g. the flex row that
 * holds the board) and pass `size` to <Board squareSize=…>. On wide screens
 * the size is capped at `maxSize`; on small screens it scales down to fit.
 */
export function useResponsiveSquare(maxSize: number, count: number, minSize = 32) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(maxSize);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setSize(Math.max(minSize, Math.min(maxSize, Math.floor((el.clientWidth - 8) / count))));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxSize, count, minSize]);

  return { ref, size };
}
