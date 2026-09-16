import type { BoardAvatarMark } from "@/lib/board-avatars";

export type BoardAvatarShape =
  | { kind: "path"; d: string; fill: string }
  | { kind: "circle"; cx: number; cy: number; r: number; fill: string };

export type BoardAvatarSticker = {
  paper: string;
  tilt: number;
  shapes: BoardAvatarShape[];
};

export const BOARD_AVATAR_STICKER_HEAD: Record<
  Extract<
    BoardAvatarMark,
    | "fox"
    | "owl"
    | "panda"
    | "whale"
    | "hare"
    | "bear"
    | "cat"
    | "dog"
    | "penguin"
    | "tiger"
    | "frog"
    | "raccoon"
  >,
  BoardAvatarSticker
> = {
  fox: {
    paper: "#ffe3b8",
    tilt: -3,
    shapes: [
      { kind: "path", d: "M8 16 10.5 5 16 12 21.5 5 24 16 20 27H12Z", fill: "#e67a1f" },
      { kind: "path", d: "M12.5 19h7L16 26Z", fill: "#fff6e8" },
      { kind: "circle", cx: 13.2, cy: 16, r: 1.35, fill: "#17211b" },
      { kind: "circle", cx: 18.8, cy: 16, r: 1.35, fill: "#17211b" },
      { kind: "circle", cx: 16, cy: 19.6, r: 1.15, fill: "#17211b" },
    ],
  },
  owl: {
    paper: "#d7e3b4",
    tilt: 2,
    shapes: [
      { kind: "path", d: "M8 13c0-6 16-6 16 0v11c0 3.4-16 3.4-16 0Z", fill: "#6b7a32" },
      { kind: "circle", cx: 12.8, cy: 15.2, r: 3.6, fill: "#fff6e8" },
      { kind: "circle", cx: 19.2, cy: 15.2, r: 3.6, fill: "#fff6e8" },
      { kind: "circle", cx: 12.8, cy: 15.2, r: 1.55, fill: "#17211b" },
      { kind: "circle", cx: 19.2, cy: 15.2, r: 1.55, fill: "#17211b" },
      { kind: "path", d: "M14.6 19.4h2.8L16 22.4Z", fill: "#e39b3a" },
    ],
  },
  panda: {
    paper: "#f3eee6",
    tilt: -2,
    shapes: [
      { kind: "circle", cx: 16, cy: 17.2, r: 8.2, fill: "#fffdf8" },
      { kind: "circle", cx: 9.6, cy: 11.2, r: 3.3, fill: "#17211b" },
      { kind: "circle", cx: 22.4, cy: 11.2, r: 3.3, fill: "#17211b" },
      { kind: "circle", cx: 12.6, cy: 16.6, r: 2.5, fill: "#17211b" },
      { kind: "circle", cx: 19.4, cy: 16.6, r: 2.5, fill: "#17211b" },
      { kind: "circle", cx: 12.6, cy: 16.6, r: 1, fill: "#fffdf8" },
      { kind: "circle", cx: 19.4, cy: 16.6, r: 1, fill: "#fffdf8" },
      { kind: "circle", cx: 16, cy: 20.6, r: 1.15, fill: "#17211b" },
    ],
  },
  whale: {
    paper: "#c5e0e6",
    tilt: 2,
    shapes: [
      { kind: "path", d: "M3 18c3-7 17-8 23-2 2 1.6.6 4-2 3.4C18 23 7 24 3 18Z", fill: "#2f7f94" },
      { kind: "path", d: "M24 15.2 31 10l-1.2 10Z", fill: "#2f7f94" },
      { kind: "path", d: "M10 13V6h2.2l.6 7Z", fill: "#7ec8d4" },
      { kind: "circle", cx: 10.4, cy: 17.2, r: 1.4, fill: "#fff6e8" },
      { kind: "circle", cx: 10.4, cy: 17.2, r: 0.7, fill: "#17211b" },
    ],
  },
  hare: {
    paper: "#f0ddc0",
    tilt: -3,
    shapes: [
      { kind: "path", d: "M11 17 9 4l6 12Z", fill: "#d7a56a" },
      { kind: "path", d: "M21 17 23 4l-6 12Z", fill: "#d7a56a" },
      { kind: "path", d: "M12.2 14 11 7l3.4 8Z", fill: "#f4c9c0" },
      { kind: "path", d: "M19.8 14 21 7l-3.4 8Z", fill: "#f4c9c0" },
      { kind: "circle", cx: 16, cy: 19.4, r: 7.1, fill: "#d7a56a" },
      { kind: "circle", cx: 13.4, cy: 18.6, r: 1.35, fill: "#17211b" },
      { kind: "circle", cx: 18.6, cy: 18.6, r: 1.35, fill: "#17211b" },
      { kind: "circle", cx: 16, cy: 21.6, r: 1.05, fill: "#17211b" },
    ],
  },
  bear: {
    paper: "#ebd2b0",
    tilt: 2,
    shapes: [
      { kind: "circle", cx: 9.4, cy: 11.6, r: 3.6, fill: "#8a5628" },
      { kind: "circle", cx: 22.6, cy: 11.6, r: 3.6, fill: "#8a5628" },
      { kind: "circle", cx: 16, cy: 18, r: 8.4, fill: "#8a5628" },
      { kind: "circle", cx: 16, cy: 20.2, r: 3.4, fill: "#d7a56a" },
      { kind: "circle", cx: 13.2, cy: 16.6, r: 1.35, fill: "#17211b" },
      { kind: "circle", cx: 18.8, cy: 16.6, r: 1.35, fill: "#17211b" },
      { kind: "circle", cx: 16, cy: 20.2, r: 1.15, fill: "#17211b" },
    ],
  },
  cat: {
    paper: "#f4d6e4",
    tilt: -3,
    shapes: [
      { kind: "path", d: "M8 17 11 5l5 9 5-9 3 12c0 8.5-16 8.5-16 0Z", fill: "#ef8fb8" },
      { kind: "circle", cx: 13.1, cy: 16.8, r: 1.55, fill: "#17211b" },
      { kind: "circle", cx: 18.9, cy: 16.8, r: 1.55, fill: "#17211b" },
      { kind: "circle", cx: 16, cy: 20.4, r: 1.05, fill: "#17211b" },
    ],
  },
  dog: {
    paper: "#f0d4a8",
    tilt: 3,
    shapes: [
      { kind: "path", d: "M6 11c0-5 8-6 9 1L12 18Z", fill: "#c9843a" },
      { kind: "circle", cx: 16, cy: 18, r: 7.8, fill: "#c9843a" },
      { kind: "path", d: "M23 16c1 7 7 6 6-1Z", fill: "#a86b2c" },
      { kind: "circle", cx: 16, cy: 20.6, r: 2.8, fill: "#e8b56a" },
      { kind: "circle", cx: 13.4, cy: 16.8, r: 1.3, fill: "#17211b" },
      { kind: "circle", cx: 18.4, cy: 16.8, r: 1.3, fill: "#17211b" },
      { kind: "circle", cx: 16, cy: 20.6, r: 1.15, fill: "#17211b" },
    ],
  },
  penguin: {
    paper: "#d5dde6",
    tilt: -2,
    shapes: [
      { kind: "path", d: "M10 8c0-3.2 12-3.2 12 0v15c0 4.2-12 4.2-12 0Z", fill: "#1d2a36" },
      { kind: "path", d: "M13 14c0 8.4 6 8.4 6 0 0-3.2-6-3.2-6 0Z", fill: "#fff6e8" },
      { kind: "path", d: "M14.2 12.6h3.6L16 15.4Z", fill: "#e39b3a" },
      { kind: "circle", cx: 13.6, cy: 11.6, r: 1.15, fill: "#fff6e8" },
      { kind: "circle", cx: 18.4, cy: 11.6, r: 1.15, fill: "#fff6e8" },
      { kind: "circle", cx: 13.6, cy: 11.6, r: 0.55, fill: "#17211b" },
      { kind: "circle", cx: 18.4, cy: 11.6, r: 0.55, fill: "#17211b" },
    ],
  },
  tiger: {
    paper: "#ffd48a",
    tilt: 3,
    shapes: [
      { kind: "path", d: "M8 17 11 5l5 9 5-9 3 12c0 8.5-16 8.5-16 0Z", fill: "#e67a1f" },
      { kind: "path", d: "M12.4 13.2h1.8v5.6h-1.8Z", fill: "#17211b" },
      { kind: "path", d: "M15.1 12.6h1.8v6.4h-1.8Z", fill: "#17211b" },
      { kind: "path", d: "M17.8 13.2h1.8v5.6h-1.8Z", fill: "#17211b" },
      { kind: "circle", cx: 13.1, cy: 17, r: 1.25, fill: "#fff6e8" },
      { kind: "circle", cx: 18.9, cy: 17, r: 1.25, fill: "#fff6e8" },
      { kind: "circle", cx: 16, cy: 21, r: 1.05, fill: "#17211b" },
    ],
  },
  frog: {
    paper: "#cce8b4",
    tilt: -2,
    shapes: [
      { kind: "path", d: "M6 20c1.2-8 18.8-8 20 0H6Z", fill: "#4f9a3c" },
      { kind: "circle", cx: 11.6, cy: 13.2, r: 3.5, fill: "#4f9a3c" },
      { kind: "circle", cx: 20.4, cy: 13.2, r: 3.5, fill: "#4f9a3c" },
      { kind: "circle", cx: 11.6, cy: 13.2, r: 2.15, fill: "#fff6e8" },
      { kind: "circle", cx: 20.4, cy: 13.2, r: 2.15, fill: "#fff6e8" },
      { kind: "circle", cx: 11.6, cy: 13.2, r: 1, fill: "#17211b" },
      { kind: "circle", cx: 20.4, cy: 13.2, r: 1, fill: "#17211b" },
    ],
  },
  raccoon: {
    paper: "#ddd6de",
    tilt: 2,
    shapes: [
      { kind: "path", d: "M8 16 11 6l5 8 5-8 3 10c0 9-16 9-16 0Z", fill: "#8b8490" },
      { kind: "path", d: "M8 17.2c3-3 13-3 16 0v4.4c-3 3-13 3-16 0Z", fill: "#17211b" },
      { kind: "circle", cx: 13.2, cy: 18.8, r: 1.35, fill: "#fff6e8" },
      { kind: "circle", cx: 18.8, cy: 18.8, r: 1.35, fill: "#fff6e8" },
      { kind: "circle", cx: 13.2, cy: 18.8, r: 0.65, fill: "#17211b" },
      { kind: "circle", cx: 18.8, cy: 18.8, r: 0.65, fill: "#17211b" },
    ],
  },
};
