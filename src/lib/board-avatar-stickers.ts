import { BOARD_AVATAR_STICKER_HEAD } from "@/lib/board-avatar-sticker-set";
import { BOARD_AVATAR_STICKER_TAIL } from "@/lib/board-avatar-sticker-tail";
import type { BoardAvatarMark } from "@/lib/board-avatars";
import type { BoardAvatarSticker } from "@/lib/board-avatar-sticker-set";

export type { BoardAvatarSticker };

export const BOARD_AVATAR_STICKERS: Record<BoardAvatarMark, BoardAvatarSticker> =
  {
    ...BOARD_AVATAR_STICKER_HEAD,
    ...BOARD_AVATAR_STICKER_TAIL,
  };
