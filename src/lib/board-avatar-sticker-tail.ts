import type { BoardAvatarMark } from "@/lib/board-avatars";
import type { BoardAvatarSticker } from "@/lib/board-avatar-sticker-set";

export const BOARD_AVATAR_STICKER_TAIL: Record<
  Extract<
    BoardAvatarMark,
    | "elephant"
    | "lion"
    | "koala"
    | "otter"
    | "hedgehog"
    | "wolf"
    | "deer"
    | "octopus"
    | "turtle"
    | "bee"
    | "parrot"
    | "axolotl"
  >,
  BoardAvatarSticker
> = {
  elephant: {
    paper: "#d4dae8",
    tilt: -3,
    shapes: [
      { kind: "path", d: "M4 12c-1-6 8-7 9 0L11 18Z", fill: "#8b93a8" },
      { kind: "path", d: "M5.6 13c0-3 5-4 6 0Z", fill: "#f0c0d0" },
      { kind: "circle", cx: 17, cy: 17.4, r: 7.6, fill: "#8b93a8" },
      { kind: "path", d: "M16 20c0 5-3 9-7.4 8.4 1.4-2.2 2.6-5 2.6-7.4Z", fill: "#8b93a8" },
      { kind: "circle", cx: 14.2, cy: 16.4, r: 1.4, fill: "#17211b" },
    ],
  },
  lion: {
    paper: "#ffe6a0",
    tilt: 2,
    shapes: [
      { kind: "path", d: "M6 16c0-5 4-9 10-9s10 4 10 9c3.2 2 2.2 9-3.4 9H9.4C4 25 2.8 18 6 16Z", fill: "#e6a21a" },
      { kind: "circle", cx: 16, cy: 16.8, r: 5.4, fill: "#f3c65a" },
      { kind: "circle", cx: 14, cy: 15.8, r: 1.2, fill: "#17211b" },
      { kind: "circle", cx: 18, cy: 15.8, r: 1.2, fill: "#17211b" },
      { kind: "circle", cx: 16, cy: 18.8, r: 1.1, fill: "#17211b" },
    ],
  },
  koala: {
    paper: "#e6ddd4",
    tilt: -2,
    shapes: [
      { kind: "circle", cx: 8.2, cy: 14.6, r: 5.1, fill: "#a89888" },
      { kind: "circle", cx: 23.8, cy: 14.6, r: 5.1, fill: "#a89888" },
      { kind: "circle", cx: 8.2, cy: 14.6, r: 2.3, fill: "#e8b8c4" },
      { kind: "circle", cx: 23.8, cy: 14.6, r: 2.3, fill: "#e8b8c4" },
      { kind: "circle", cx: 16, cy: 18.4, r: 6.6, fill: "#c4b4a4" },
      { kind: "circle", cx: 13.6, cy: 17.6, r: 1.3, fill: "#17211b" },
      { kind: "circle", cx: 18.4, cy: 17.6, r: 1.3, fill: "#17211b" },
      { kind: "circle", cx: 16, cy: 20.6, r: 1.1, fill: "#17211b" },
    ],
  },
  otter: {
    paper: "#efd2b0",
    tilt: 3,
    shapes: [
      { kind: "path", d: "M3 19c4-7 17-8 23-2 2 1.8.8 4.2-1.6 3.4C18 24 7 25 3 19Z", fill: "#b06a38" },
      { kind: "path", d: "M23.6 17.2 31 24 22.8 21Z", fill: "#b06a38" },
      { kind: "circle", cx: 11, cy: 17.4, r: 1.45, fill: "#fff6e8" },
      { kind: "circle", cx: 11, cy: 17.4, r: 0.7, fill: "#17211b" },
    ],
  },
  hedgehog: {
    paper: "#efd4b4",
    tilt: -2,
    shapes: [
      { kind: "path", d: "M9 14 11 4 14 14Z", fill: "#7a5330" },
      { kind: "path", d: "M14 13 16 3 18 13Z", fill: "#7a5330" },
      { kind: "path", d: "M18 14 21 4 23 14Z", fill: "#7a5330" },
      { kind: "path", d: "M7 20c1-8 17-8 18 0H7Z", fill: "#c9843a" },
      { kind: "circle", cx: 11.4, cy: 18.4, r: 1.35, fill: "#17211b" },
    ],
  },
  wolf: {
    paper: "#d5dbe4",
    tilt: 3,
    shapes: [
      { kind: "path", d: "M8 17 13 5l3 8 3-8 5 12-3 10H11Z", fill: "#6f7b8c" },
      { kind: "path", d: "M13 20h6L16 26Z", fill: "#dfe6ee" },
      { kind: "circle", cx: 13.6, cy: 16.8, r: 1.3, fill: "#17211b" },
      { kind: "circle", cx: 18.4, cy: 16.8, r: 1.3, fill: "#17211b" },
      { kind: "circle", cx: 16, cy: 20.4, r: 1.05, fill: "#17211b" },
    ],
  },
  deer: {
    paper: "#efe0c0",
    tilt: -2,
    shapes: [
      { kind: "path", d: "M12 16 6 3l6 4 2 7Z", fill: "#8a6a38" },
      { kind: "path", d: "M20 16 26 3l-6 4-2 7Z", fill: "#8a6a38" },
      { kind: "circle", cx: 16, cy: 19, r: 7, fill: "#c9a05a" },
      { kind: "circle", cx: 13.6, cy: 18, r: 1.25, fill: "#17211b" },
      { kind: "circle", cx: 18.4, cy: 18, r: 1.25, fill: "#17211b" },
    ],
  },
  octopus: {
    paper: "#f3d0de",
    tilt: 2,
    shapes: [
      { kind: "circle", cx: 16, cy: 15, r: 7.2, fill: "#d45a90" },
      { kind: "path", d: "M8 16 5 27h5Z", fill: "#d45a90" },
      { kind: "path", d: "M13 17 11 28h5Z", fill: "#d45a90" },
      { kind: "path", d: "M19 17 16 28h5Z", fill: "#d45a90" },
      { kind: "path", d: "M24 16 22 27h5Z", fill: "#d45a90" },
      { kind: "circle", cx: 13.4, cy: 14.4, r: 1.8, fill: "#fff6e8" },
      { kind: "circle", cx: 18.6, cy: 14.4, r: 1.8, fill: "#fff6e8" },
      { kind: "circle", cx: 13.4, cy: 14.4, r: 0.8, fill: "#17211b" },
      { kind: "circle", cx: 18.6, cy: 14.4, r: 0.8, fill: "#17211b" },
    ],
  },
  turtle: {
    paper: "#cfe8c6",
    tilt: -2,
    shapes: [
      { kind: "path", d: "M8 18c2-7.4 14-7.4 16 0-2 5.2-14 5.2-16 0Z", fill: "#3f8a4a" },
      { kind: "path", d: "M14 6h4v6h-4Z", fill: "#3f8a4a" },
      { kind: "path", d: "M4 17 2 22h7Z", fill: "#3f8a4a" },
      { kind: "path", d: "M28 17 30 22h-7Z", fill: "#3f8a4a" },
      { kind: "path", d: "M12.6 15h6.8v1.7h-6.8Z", fill: "#2d6a36" },
      { kind: "path", d: "M15.15 12.8h1.7v7.2h-1.7Z", fill: "#2d6a36" },
      { kind: "circle", cx: 16, cy: 8.2, r: 1.35, fill: "#17211b" },
    ],
  },
  bee: {
    paper: "#fff1a8",
    tilt: 3,
    shapes: [
      { kind: "path", d: "M7 10c-4.4 0-5.4 6-1.6 7l6-2.4Z", fill: "#eef6ff" },
      { kind: "path", d: "M25 10c4.4 0 5.4 6 1.6 7l-6-2.4Z", fill: "#eef6ff" },
      { kind: "path", d: "M11 13c0-5.2 10-5.2 10 0s-2.2 10.4-5 10.4S11 18.2 11 13Z", fill: "#f0c000" },
      { kind: "path", d: "M12.1 15.5h7.8v1.7H12.1Z", fill: "#17211b" },
      { kind: "path", d: "M12.5 18.6h7v1.7h-7Z", fill: "#17211b" },
      { kind: "circle", cx: 14.2, cy: 13.2, r: 1.1, fill: "#17211b" },
      { kind: "circle", cx: 17.8, cy: 13.2, r: 1.1, fill: "#17211b" },
    ],
  },
  parrot: {
    paper: "#b8ebc8",
    tilt: -3,
    shapes: [
      { kind: "path", d: "M11 8c10 1 12 11 6.4 17-8 3.2-11-5.4-7.2-14Z", fill: "#2f9a5a" },
      { kind: "path", d: "M14 15 23 11 16 20Z", fill: "#e35b3a" },
      { kind: "circle", cx: 16.8, cy: 12.2, r: 1.7, fill: "#fff6e8" },
      { kind: "circle", cx: 16.8, cy: 12.2, r: 0.8, fill: "#17211b" },
    ],
  },
  axolotl: {
    paper: "#f8d4e0",
    tilt: 2,
    shapes: [
      { kind: "path", d: "M9 13 2 8 8 16Z", fill: "#ef6d98" },
      { kind: "path", d: "M9 17 1 18 8 21Z", fill: "#ef6d98" },
      { kind: "path", d: "M23 13 30 8 24 16Z", fill: "#ef6d98" },
      { kind: "path", d: "M23 17 31 18 24 21Z", fill: "#ef6d98" },
      { kind: "path", d: "M9 18c1-7.2 13-7.2 14 0-1 5.2-13 5.2-14 0Z", fill: "#f4a0bc" },
      { kind: "circle", cx: 13.6, cy: 17.2, r: 1.4, fill: "#17211b" },
      { kind: "circle", cx: 18.4, cy: 17.2, r: 1.4, fill: "#17211b" },
    ],
  },
};
