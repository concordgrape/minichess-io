export const AD_PLACEMENTS = {
  incontent300x250: {
    placementName: "chesspuzzles-online_incontent_300x250",
    slotId: "chesspuzzles-online_incontent_300x250",
    width: 300,
    height: 250,
  },
} as const;

export type AdPlacement = keyof typeof AD_PLACEMENTS;

// Dynamic units that persist across SPA navigation (see FreestarNavigation).
export const FREESTAR_UNITS = {
  stickyFooter: "chesspuzzles-online_sticky_footer",
  pushdown: "chesspuzzles-online_sticky_pushdown",
  video: "freestarvideoadcontainer_slider",
} as const;
