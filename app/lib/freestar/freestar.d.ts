interface FreestarGlobal {
  queue: Array<() => void>;
  newAdSlots?: (slots: { placementName: string; slotId: string } | Array<{ placementName: string; slotId: string }>) => void;
  deleteAdSlots?: (slotId: string | string[]) => void;
}

interface Window {
  freestar?: FreestarGlobal;
}
