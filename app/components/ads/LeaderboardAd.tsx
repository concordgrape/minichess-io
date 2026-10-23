"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import AdSlot from "./AdSlot";

// Renders the leaderboard unit into Shell's #top-ad-mount, between the header and the page.
// Keyed by pathname so the unit is recalled on each client-side navigation.
export default function LeaderboardAd() {
  const pathname = usePathname();
  // null on the server and during hydration; the element once the client has mounted.
  const mount = useSyncExternalStore(
    () => () => {},
    () => document.getElementById("top-ad-mount"),
    () => null,
  );

  return mount ? createPortal(<AdSlot key={pathname} placement="leaderboard" />, mount) : null;
}
