export const BOARD_AVATAR_MARKS = [
  "fox",
  "owl",
  "panda",
  "whale",
  "hare",
  "bear",
  "cat",
  "dog",
  "penguin",
  "tiger",
  "frog",
  "raccoon",
  "elephant",
  "lion",
  "koala",
  "otter",
  "hedgehog",
  "wolf",
  "deer",
  "octopus",
  "turtle",
  "bee",
  "parrot",
  "axolotl",
] as const;

export type BoardAvatarMark = (typeof BOARD_AVATAR_MARKS)[number];

export function isBoardAvatarMark(value: string | null | undefined): value is BoardAvatarMark {
  return (
    typeof value === "string" &&
    (BOARD_AVATAR_MARKS as readonly string[]).includes(value)
  );
}

export function hashAvatarSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function takenBoardAvatarMarks(taken: Iterable<string>): Set<BoardAvatarMark> {
  return new Set(
    [...taken].filter((item) => isBoardAvatarMark(item)),
  );
}

export function hasFreeAvatar(taken: Iterable<string>): boolean {
  return takenBoardAvatarMarks(taken).size < BOARD_AVATAR_MARKS.length;
}

/** First unused mark, starting from a stable hash of the participant id. */
export function pickFreeAvatar(
  seed: string,
  taken: Iterable<string>,
): BoardAvatarMark {
  const used = takenBoardAvatarMarks(taken);
  const start = hashAvatarSeed(seed) % BOARD_AVATAR_MARKS.length;
  for (let step = 0; step < BOARD_AVATAR_MARKS.length; step += 1) {
    const mark = BOARD_AVATAR_MARKS[(start + step) % BOARD_AVATAR_MARKS.length];
    if (!used.has(mark)) {
      return mark;
    }
  }
  return BOARD_AVATAR_MARKS[start];
}
