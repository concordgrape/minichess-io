"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isNoAdRoute } from "../../lib/freestar/routes";
import { FREESTAR_UNITS } from "../../lib/freestar/placements";

// Mounted once in Shell. On client-side navigation, tears down the Freestar units that
// persist across routes and recalls them, except on no-ad routes (Freestar's SPA advice).
export default function FreestarNavigation() {
  const pathname = usePathname();
  const previous = useRef(pathname);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    // Only act once pubfig has loaded; otherwise there is nothing to tear down yet.
    if (typeof window.freestar?.deleteStickyFooter !== "function") return;
    const recall = !isNoAdRoute(pathname);
    window.freestar.queue?.push(() => {
      const fs = window.freestar;
      fs?.deleteStickyFooter?.(FREESTAR_UNITS.stickyFooter);
      fs?.deletePushdown?.(FREESTAR_UNITS.pushdown);
      fs?.deleteVideo?.(FREESTAR_UNITS.video);
      if (recall) {
        fs?.newStickyFooter?.(FREESTAR_UNITS.stickyFooter);
        fs?.newPushdown?.(FREESTAR_UNITS.pushdown);
        fs?.newVideo?.(FREESTAR_UNITS.video);
      }
    });
  }, [pathname]);

  return null;
}
