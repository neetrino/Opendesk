"use client";

import {
  COMMENT_REACTION_GLYPHS,
  type CommentReactionEmoji,
} from "@/lib/comment-reactions";
import { COMMENT_REACTION_EMOJIS } from "@/lib/constants";
import { useI18n } from "@/i18n/provider";

type ThreadMessageMenuProps = {
  isOwn: boolean;
  pinned: boolean;
  deleted: boolean;
  onReply: () => void;
  onReact: (emoji: CommentReactionEmoji) => void;
  onCopy: () => void;
  onPin: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCreateCard: () => void;
};

export function ThreadMessageMenu({
  isOwn,
  pinned,
  deleted,
  onReply,
  onReact,
  onCopy,
  onPin,
  onEdit,
  onDelete,
  onCreateCard,
}: ThreadMessageMenuProps) {
  const { t } = useI18n();
  if (deleted) {
    return null;
  }

  return (
    <div className="thread-menu">
      <div className="thread-react-row" role="group" aria-label={t.cardPage.messageActions}>
        {COMMENT_REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="thread-react-btn"
            onClick={() => onReact(emoji)}
            aria-label={reactionLabel(emoji, t.cardPage)}
            title={reactionLabel(emoji, t.cardPage)}
          >
            {COMMENT_REACTION_GLYPHS[emoji]}
          </button>
        ))}
      </div>
      <div className="thread-menu-actions">
        <button type="button" onClick={onReply}>
          {t.cardPage.reply}
        </button>
        <button type="button" onClick={onCopy}>
          {t.cardPage.copyMessage}
        </button>
        <button type="button" onClick={onPin}>
          {pinned ? t.cardPage.unpinMessage : t.cardPage.pinMessage}
        </button>
        <button type="button" onClick={onCreateCard}>
          {t.cardPage.createCardFromMessage}
        </button>
        {isOwn ? (
          <>
            <button type="button" onClick={onEdit}>
              {t.cardPage.editMessage}
            </button>
            <button type="button" onClick={onDelete}>
              {t.cardPage.deleteMessage}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function reactionLabel(
  emoji: CommentReactionEmoji,
  copy: {
    reactionAgree: string;
    reactionDone: string;
    reactionWatching: string;
    reactionQuestion: string;
    reactionBlocker: string;
  },
): string {
  const labels = {
    agree: copy.reactionAgree,
    done: copy.reactionDone,
    watching: copy.reactionWatching,
    question: copy.reactionQuestion,
    blocker: copy.reactionBlocker,
  } as const;
  return labels[emoji];
}
