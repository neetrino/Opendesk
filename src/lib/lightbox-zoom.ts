export const LIGHTBOX_ZOOM_MIN = 1;
export const LIGHTBOX_ZOOM_STEP = 1.75;
export const LIGHTBOX_ZOOM_WHEEL = 1.12;
export const LIGHTBOX_ZOOM_HARD_CAP = 24;
export const LIGHTBOX_ZOOM_MIN_MAX = 3;
export const LIGHTBOX_NATIVE_SCALE_HEADROOM = 2;
export const LIGHTBOX_PAN_THRESHOLD_PX = 8;
export const LIGHTBOX_IMAGE_MAX_WIDTH_PX = 920;
export const LIGHTBOX_IMAGE_MAX_HEIGHT_RATIO = 0.78;
export const LIGHTBOX_IMAGE_GUTTER_PX = 40;
export const LIGHTBOX_TOGGLE_IGNORE_MS = 280;

export type LightboxZoom = {
  scale: number;
  x: number;
  y: number;
};

export type LightboxLayout = {
  viewWidth: number;
  viewHeight: number;
  displayWidth: number;
  displayHeight: number;
  maxScale: number;
  readableScale: number;
};

export const LIGHTBOX_ZOOM_RESET: LightboxZoom = { scale: 1, x: 0, y: 0 };

export function containedDisplaySize(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (naturalWidth <= 0 || naturalHeight <= 0 || maxWidth <= 0 || maxHeight <= 0) {
    return { width: 0, height: 0 };
  }
  const ratio = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1);
  return {
    width: naturalWidth * ratio,
    height: naturalHeight * ratio,
  };
}

/** Allow 1:1 pixels (and a little more), enough to read a tall screenshot. */
export function maxLightboxScale(
  naturalWidth: number,
  displayWidth: number,
): number {
  if (displayWidth <= 0) {
    return LIGHTBOX_ZOOM_MIN_MAX;
  }
  const nativeScale = naturalWidth / displayWidth;
  return Math.min(
    LIGHTBOX_ZOOM_HARD_CAP,
    Math.max(
      LIGHTBOX_ZOOM_MIN_MAX,
      nativeScale * LIGHTBOX_NATIVE_SCALE_HEADROOM,
    ),
  );
}

export function readableLightboxScale(
  naturalWidth: number,
  displayWidth: number,
  maxScale: number,
): number {
  if (displayWidth <= 0) {
    return LIGHTBOX_ZOOM_MIN;
  }
  const nativeScale = naturalWidth / displayWidth;
  return clampScale(Math.max(LIGHTBOX_ZOOM_MIN, nativeScale), maxScale);
}

export function readLightboxLayout(
  viewWidth: number,
  viewHeight: number,
  naturalWidth: number,
  naturalHeight: number,
): LightboxLayout {
  const maxWidth = Math.min(
    LIGHTBOX_IMAGE_MAX_WIDTH_PX,
    Math.max(0, viewWidth - LIGHTBOX_IMAGE_GUTTER_PX),
  );
  const maxHeight = viewHeight * LIGHTBOX_IMAGE_MAX_HEIGHT_RATIO;
  const display = containedDisplaySize(
    naturalWidth,
    naturalHeight,
    maxWidth,
    maxHeight,
  );
  const maxScale = maxLightboxScale(naturalWidth, display.width);
  return {
    viewWidth,
    viewHeight,
    displayWidth: display.width,
    displayHeight: display.height,
    maxScale,
    readableScale: readableLightboxScale(
      naturalWidth,
      display.width,
      maxScale,
    ),
  };
}

export function clampScale(scale: number, maxScale: number): number {
  return Math.min(maxScale, Math.max(LIGHTBOX_ZOOM_MIN, scale));
}

export function nextScaleUp(
  current: number,
  maxScale: number,
  readableScale: number,
): number {
  if (current < readableScale * 0.95) {
    return clampScale(Math.max(readableScale, current * LIGHTBOX_ZOOM_STEP), maxScale);
  }
  return clampScale(current * LIGHTBOX_ZOOM_STEP, maxScale);
}

export function nextScaleDown(current: number, readableScale: number): number {
  if (current > readableScale * 1.05) {
    return Math.max(readableScale, current / LIGHTBOX_ZOOM_STEP);
  }
  return LIGHTBOX_ZOOM_MIN;
}

export function toggleLightboxScale(
  current: number,
  maxScale: number,
  readableScale: number,
): number {
  if (current > 1.05) {
    return LIGHTBOX_ZOOM_MIN;
  }
  const stepped = current * LIGHTBOX_ZOOM_STEP;
  const target = Math.max(readableScale, stepped);
  return clampScale(target, maxScale);
}

export function zoomAtPoint(input: {
  current: LightboxZoom;
  nextScale: number;
  focusX: number;
  focusY: number;
}): LightboxZoom {
  const scale = Math.max(input.current.scale, 0.0001);
  const localX = (input.focusX - input.current.x) / scale;
  const localY = (input.focusY - input.current.y) / scale;
  return {
    scale: input.nextScale,
    x: input.focusX - localX * input.nextScale,
    y: input.focusY - localY * input.nextScale,
  };
}

export function panZoom(
  current: LightboxZoom,
  dx: number,
  dy: number,
): LightboxZoom {
  return {
    scale: current.scale,
    x: current.x + dx,
    y: current.y + dy,
  };
}

export function clampPan(
  zoom: LightboxZoom,
  layout: LightboxLayout,
): LightboxZoom {
  const scaledWidth = layout.displayWidth * zoom.scale;
  const scaledHeight = layout.displayHeight * zoom.scale;
  const maxX = Math.max(0, (scaledWidth - layout.viewWidth) / 2);
  const maxY = Math.max(0, (scaledHeight - layout.viewHeight) / 2);
  return {
    scale: zoom.scale,
    x: Math.min(maxX, Math.max(-maxX, zoom.x)),
    y: Math.min(maxY, Math.max(-maxY, zoom.y)),
  };
}

/** After a large zoom-in, show the top of a tall screenshot. */
export function alignZoomToTop(
  zoom: LightboxZoom,
  layout: LightboxLayout,
): LightboxZoom {
  const scaledHeight = layout.displayHeight * zoom.scale;
  if (scaledHeight <= layout.viewHeight) {
    return { ...zoom, x: 0, y: 0 };
  }
  return {
    ...zoom,
    x: 0,
    y: (scaledHeight - layout.viewHeight) / 2,
  };
}

export function pointerDistance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function pointerMidpoint(
  a: { x: number; y: number },
  b: { x: number; y: number },
): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function stageFocus(
  clientX: number,
  clientY: number,
  view: { left: number; top: number; width: number; height: number },
): { focusX: number; focusY: number } {
  return {
    focusX: clientX - (view.left + view.width / 2),
    focusY: clientY - (view.top + view.height / 2),
  };
}
