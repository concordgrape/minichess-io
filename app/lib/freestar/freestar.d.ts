interface FreestarGlobal {
  queue: Array<() => void>;
  newAdSlots?: (slots: { placementName: string; slotId: string } | Array<{ placementName: string; slotId: string }>) => void;
  deleteAdSlots?: (slotId: string | string[]) => void;
  newStickyFooter?: (placementName: string) => void;
  deleteStickyFooter?: (placementName: string) => void;
  newPushdown?: (placementName: string) => void;
  deletePushdown?: (placementName: string) => void;
  newVideo?: (placementName: string) => void;
  deleteVideo?: (placementName: string) => void;
}

interface Window {
  freestar?: FreestarGlobal;
}
