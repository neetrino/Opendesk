export const OVERLAY_LAYERS = ["card", "camera", "media"] as const;
export type OverlayLayerId = (typeof OVERLAY_LAYERS)[number];

export const OVERLAY_HASH_PREFIX = "opendesk-";
export const OVERLAY_EDGE_BACK_PX = 32;
export const OVERLAY_EDGE_BACK_DISTANCE_PX = 56;
export const OVERLAY_EDGE_BACK_IGNORE_TOP_PX = 80;

export function overlayHash(layer: OverlayLayerId): string {
  return `${OVERLAY_HASH_PREFIX}${layer}`;
}

export function parseOverlayHash(hash: string): OverlayLayerId | null {
  const normalized = hash.startsWith("#") ? hash.slice(1) : hash;
  for (const layer of OVERLAY_LAYERS) {
    if (normalized === overlayHash(layer)) {
      return layer;
    }
  }
  return null;
}

export function overlayHref(currentHref: string, layer: OverlayLayerId): string {
  const url = new URL(currentHref, "https://opendesk.local");
  url.hash = overlayHash(layer);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function stripOverlayHash(currentHref: string): string {
  const url = new URL(currentHref, "https://opendesk.local");
  return `${url.pathname}${url.search}`;
}

export function shouldPopOverlayEntry(
  pushed: boolean,
  hash: string,
  layer: OverlayLayerId,
): boolean {
  return pushed && parseOverlayHash(hash) === layer;
}

export function isOverlayEdgeStart(clientX: number, clientY: number): boolean {
  return (
    clientX <= OVERLAY_EDGE_BACK_PX && clientY >= OVERLAY_EDGE_BACK_IGNORE_TOP_PX
  );
}

export function shouldBlockBrowserBack(input: {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}): boolean {
  if (!isOverlayEdgeStart(input.startX, input.startY)) {
    return false;
  }
  const dx = input.currentX - input.startX;
  const dy = Math.abs(input.currentY - input.startY);
  return dx > 10 && dx > dy;
}

export function isEdgeBackSwipe(input: {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}): boolean {
  if (!isOverlayEdgeStart(input.startX, input.startY)) {
    return false;
  }
  const dx = input.endX - input.startX;
  const dy = Math.abs(input.endY - input.startY);
  return dx >= OVERLAY_EDGE_BACK_DISTANCE_PX && dx > dy;
}

export function destinationLeavesPage(
  currentHref: string,
  destinationHref: string,
): boolean {
  const current = new URL(currentHref, "https://opendesk.local");
  const destination = new URL(destinationHref, "https://opendesk.local");
  return (
    current.pathname !== destination.pathname ||
    current.search !== destination.search
  );
}
