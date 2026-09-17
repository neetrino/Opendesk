import { describe, expect, it } from "vitest";
import {
  LIGHTBOX_ZOOM_STEPS,
  alignZoomToTop,
  clampPan,
  containedDisplaySize,
  maxLightboxScale,
  nextScaleDown,
  nextScaleUp,
  panZoom,
  pointerDistance,
  pointerMidpoint,
  readLightboxLayout,
  readableLightboxScale,
  scaleFromZoomProgress,
  stageFocus,
  zoomAtPoint,
  zoomProgress,
} from "@/lib/lightbox-zoom";

describe("lightbox zoom", () => {
  it("shrinks a tall screenshot to fit without upscaling small photos", () => {
    expect(containedDisplaySize(400, 8000, 920, 780)).toEqual({
      width: 39,
      height: 780,
    });
    expect(containedDisplaySize(200, 120, 920, 780)).toEqual({
      width: 200,
      height: 120,
    });
  });

  it("lets a skinny screenshot reach native size and a little more", () => {
    expect(maxLightboxScale(400, 40)).toBe(20);
    expect(readableLightboxScale(400, 40, 20)).toBe(10);
    expect(maxLightboxScale(800, 800)).toBe(3);
  });

  it("reaches max in five equal 20% steps", () => {
    expect(LIGHTBOX_ZOOM_STEPS).toBe(5);
    expect(nextScaleUp(1, 3)).toBe(1.4);
    expect(nextScaleUp(1.4, 3)).toBe(1.8);
    expect(nextScaleUp(2.6, 3)).toBe(3);
    expect(nextScaleDown(3, 3)).toBe(2.6);
    expect(nextScaleDown(1.4, 3)).toBe(1);
    expect(zoomProgress(1, 3)).toBe(0);
    expect(zoomProgress(3, 3)).toBe(1);
    expect(scaleFromZoomProgress(0.4, 3)).toBe(1.8);
    let scale = 1;
    for (let step = 0; step < LIGHTBOX_ZOOM_STEPS; step += 1) {
      scale = nextScaleUp(scale, 6);
    }
    expect(scale).toBe(6);
  });

  it("keeps the focus point still while scaling", () => {
    const next = zoomAtPoint({
      current: { scale: 1, x: 0, y: 0 },
      nextScale: 2,
      focusX: 100,
      focusY: -40,
    });
    expect(next).toEqual({ scale: 2, x: -100, y: 40 });
  });

  it("clamps pan so a short axis stays centered", () => {
    const layout = readLightboxLayout(1000, 800, 400, 8000);
    const panned = clampPan({ scale: 10, x: 400, y: 20000 }, layout);
    expect(panned.x).toBe(0);
    expect(panned.y).toBeGreaterThan(0);
    expect(panned.y).toBeLessThan(20000);
  });

  it("aligns a tall zoom to the top of the viewport", () => {
    const layout = readLightboxLayout(1000, 800, 400, 8000);
    const aligned = alignZoomToTop({ scale: 10, x: 20, y: 0 }, layout);
    expect(aligned.x).toBe(0);
    expect(aligned.y).toBe(
      (layout.displayHeight * 10 - layout.viewHeight) / 2,
    );
  });

  it("moves the photo by the pointer delta", () => {
    expect(panZoom({ scale: 2, x: 4, y: -3 }, 10, -5)).toEqual({
      scale: 2,
      x: 14,
      y: -8,
    });
  });

  it("reads pinch geometry from two pointers", () => {
    expect(pointerDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(pointerMidpoint({ x: 0, y: 2 }, { x: 4, y: 6 })).toEqual({
      x: 2,
      y: 4,
    });
    expect(
      stageFocus(120, 80, { left: 20, top: 20, width: 200, height: 100 }),
    ).toEqual({ focusX: 0, focusY: 10 });
  });
});
