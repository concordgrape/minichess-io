"use client";

import { useEffect } from "react";
import { AD_PLACEMENTS, type AdPlacement } from "../../lib/freestar/placements";

// Pass a stable `key` at each call site so the slot survives re-renders that
// change the surrounding tree (e.g. loading -> loaded) without re-registering.
// Pass a placement if other than the default incontent300x250
export default function AdSlot({ placement = "incontent300x250", debug = false }: { placement?: AdPlacement; debug?: boolean }) {
  const { placementName, slotId, width, height } = AD_PLACEMENTS[placement];

  useEffect(() => {
    const fs = (window.freestar ??= { queue: [] });
    fs.queue.push(() => window.freestar?.newAdSlots?.({ placementName, slotId }));
    return () => {
      window.freestar?.queue.push(() => window.freestar?.deleteAdSlots?.(slotId));
    };
  }, [placementName, slotId]);

  return (
    <div
      id={slotId}
      className="mt-3 mx-auto"
      style={{ width, height, ...(debug ? { backgroundColor: "rebeccapurple" } : {}) }}
    />
  );
}
