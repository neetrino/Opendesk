import { BOARD_AVATAR_STICKERS } from "@/lib/board-avatar-stickers";
import type {
  BoardAvatarShape,
  BoardAvatarSticker,
} from "@/lib/board-avatar-sticker-set";
import {
  isBoardAvatarMark,
  type BoardAvatarMark,
} from "@/lib/board-avatars";
import { displayInitials } from "@/lib/initials";

type BoardAvatarProps = {
  name: string;
  mark?: string | null;
  size?: "sm" | "md";
};

function StickerShape({ shape }: { shape: BoardAvatarShape }) {
  if (shape.kind === "circle") {
    return <circle cx={shape.cx} cy={shape.cy} r={shape.r} fill={shape.fill} />;
  }
  return <path d={shape.d} fill={shape.fill} />;
}

function StickerFace({ sticker }: { sticker: BoardAvatarSticker }) {
  return (
    <g transform={`rotate(${sticker.tilt} 16 16)`}>
      <rect x="2.2" y="2.2" width="27.6" height="27.6" rx="8" fill={sticker.paper} />
      {sticker.shapes.map((shape, index) => (
        <StickerShape key={`${shape.kind}-${index}`} shape={shape} />
      ))}
    </g>
  );
}

export function BoardAvatar({ name, mark, size = "sm" }: BoardAvatarProps) {
  const key: BoardAvatarMark | null = isBoardAvatarMark(mark) ? mark : null;
  const sticker = key ? BOARD_AVATAR_STICKERS[key] : null;
  const className = size === "md" ? "board-avatar is-sticker" : "card-avatar is-sticker";

  if (!sticker) {
    return (
      <span className={size === "md" ? "board-avatar" : "card-avatar"} aria-hidden="true">
        {displayInitials(name)}
      </span>
    );
  }

  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 32 32" width="100%" height="100%">
        <StickerFace sticker={sticker} />
      </svg>
    </span>
  );
}
