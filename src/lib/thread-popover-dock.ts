import type { Middleware } from "@floating-ui/react";

const OVERLAP = 0.3;
const EDGE = 16;
const PAD = 10;

function sheetRect(): DOMRect | null {
  return document.querySelector(".card-sheet")?.getBoundingClientRect() ?? null;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

/** Docks the menu to the bubble: 30% overlap, from the bottom edge or the top. */
export const threadPopoverDock: Middleware = {
  name: "threadPopoverDock",
  fn({ rects }) {
    const menu = rects.floating;
    const bubble = rects.reference;
    const overlap = Math.round(menu.width * OVERLAP);
    const sheet = sheetRect();
    let x = bubble.x + bubble.width - overlap;
    let y = bubble.y + bubble.height - EDGE;
    if (sheet && y + menu.height > sheet.bottom - PAD) {
      y = bubble.y - menu.height + EDGE;
    }
    if (sheet) {
      x = clamp(x, sheet.left + PAD, sheet.right - PAD - menu.width);
      y = clamp(y, sheet.top + PAD, sheet.bottom - PAD - menu.height);
    }
    return { x, y };
  },
};
