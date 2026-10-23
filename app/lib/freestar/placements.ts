export interface AdPlacementConfig {
  placementName: string;
  slotId: string;
  // Omit for slots that Freestar's cls.css sizes by ID.
  width?: number;
  height?: number;
}

export const AD_PLACEMENTS = {
  incontent300x250: {
    placementName: "chesspuzzles-online_incontent_300x250",
    slotId: "chesspuzzles-online_incontent_300x250",
    width: 300,
    height: 250,
  },
  // 320x50 / 300x50 below 768px, 728x90 at 768-999px, 728x90 / 970x90 from 1000px.
  // cls.css reserves the height per breakpoint, so no size here.
  leaderboard: {
    placementName: "chesspuzzles-online_1_leaderboard",
    slotId: "chesspuzzles-online_1_leaderboard",
  },
} as const satisfies Record<string, AdPlacementConfig>;

export type AdPlacement = keyof typeof AD_PLACEMENTS;

// Dynamic units that persist across SPA navigation (see FreestarNavigation).
export const FREESTAR_UNITS = {
  stickyFooter: "chesspuzzles-online_sticky_footer",
  pushdown: "chesspuzzles-online_sticky_pushdown",
  video: "freestarvideoadcontainer_slider",
} as const;
