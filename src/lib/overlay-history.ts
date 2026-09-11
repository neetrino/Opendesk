export const CAMERA_HISTORY_MARKER = "opendeskCameraOpen";

export function withOverlayMarker(
  state: unknown,
  marker: string,
): Record<string, unknown> {
  const base: Record<string, unknown> =
    typeof state === "object" && state !== null && !Array.isArray(state)
      ? { ...(state as Record<string, unknown>) }
      : {};
  return { ...base, [marker]: true };
}

export function hasOverlayMarker(state: unknown, marker: string): boolean {
  if (typeof state !== "object" || state === null) {
    return false;
  }
  return (state as Record<string, unknown>)[marker] === true;
}
