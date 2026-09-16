import { COMMENT_REACTION_EMOJIS } from "@/lib/constants";

export type CommentReactionEmoji = (typeof COMMENT_REACTION_EMOJIS)[number];

export const COMMENT_REACTION_GLYPHS: Record<CommentReactionEmoji, string> = {
  agree: "\u{1F44D}",
  done: "\u{2705}",
  watching: "\u{1F440}",
  question: "\u{2753}",
  blocker: "\u{2757}",
};

export function isCommentReactionEmoji(
  value: string,
): value is CommentReactionEmoji {
  return (COMMENT_REACTION_EMOJIS as readonly string[]).includes(value);
}

export type ThreadReactionCount = {
  emoji: CommentReactionEmoji;
  count: number;
  reactedByMe: boolean;
};

export function toggleLocalReaction(
  reactions: ThreadReactionCount[],
  emoji: CommentReactionEmoji,
): ThreadReactionCount[] {
  const existing = reactions.find((item) => item.emoji === emoji);
  if (!existing) {
    return [...reactions, { emoji, count: 1, reactedByMe: true }];
  }
  if (existing.reactedByMe && existing.count <= 1) {
    return reactions.filter((item) => item.emoji !== emoji);
  }
  return reactions.map((item) =>
    item.emoji === emoji
      ? {
          ...item,
          count: item.reactedByMe ? item.count - 1 : item.count + 1,
          reactedByMe: !item.reactedByMe,
        }
      : item,
  );
}

export function aggregateReactions(
  rows: Array<{ emoji: CommentReactionEmoji; participantId: string }>,
  viewerId: string,
): ThreadReactionCount[] {
  const counts = new Map<CommentReactionEmoji, ThreadReactionCount>();
  for (const row of rows) {
    const current = counts.get(row.emoji) ?? {
      emoji: row.emoji,
      count: 0,
      reactedByMe: false,
    };
    current.count += 1;
    if (row.participantId === viewerId) {
      current.reactedByMe = true;
    }
    counts.set(row.emoji, current);
  }
  return COMMENT_REACTION_EMOJIS.flatMap((emoji) => {
    const item = counts.get(emoji);
    return item ? [item] : [];
  });
}
