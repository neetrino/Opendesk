"use client";

import {
  FloatingFocusManager,
  FloatingPortal,
  type FloatingContext,
} from "@floating-ui/react";
import type { CSSProperties, ReactNode } from "react";
import {
  CopyActionIcon,
  DeleteActionIcon,
  EditActionIcon,
  PinActionIcon,
  ReplyActionIcon,
  TaskActionIcon,
} from "@/components/thread-action-icons";
import {
  COMMENT_REACTION_GLYPHS,
  type CommentReactionEmoji,
} from "@/lib/comment-reactions";
import { COMMENT_REACTION_EMOJIS } from "@/lib/constants";
import { useI18n } from "@/i18n/provider";

type ThreadActionPopoverProps = {
  context: FloatingContext;
  setFloating: (node: HTMLDivElement | null) => void;
  floatingStyles: CSSProperties;
  floatingProps: Record<string, unknown>;
  isOwn: boolean;
  pinned: boolean;
  onReply: () => void;
  onReact: (emoji: CommentReactionEmoji) => void;
  onCopy: () => void;
  onPin: () => void;
  onCreateCard: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function ThreadActionPopover({
  context,
  setFloating,
  floatingStyles,
  floatingProps,
  isOwn,
  pinned,
  onReply,
  onReact,
  onCopy,
  onPin,
  onCreateCard,
  onEdit,
  onDelete,
}: ThreadActionPopoverProps) {
  return (
    <FloatingPortal>
      <FloatingFocusManager context={context} modal={false}>
        <div
          className="thread-popover"
          ref={setFloating}
          style={floatingStyles}
          {...floatingProps}
        >
          <ThreadReactionOrbs onReact={onReact} />
          <ThreadActionList
            isOwn={isOwn}
            pinned={pinned}
            onReply={onReply}
            onCopy={onCopy}
            onPin={onPin}
            onCreateCard={onCreateCard}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  );
}

function ThreadReactionOrbs({
  onReact,
}: {
  onReact: (emoji: CommentReactionEmoji) => void;
}) {
  const { t } = useI18n();
  return (
    <div
      className="thread-popover-react"
      role="group"
      aria-label={t.cardPage.messageActions}
    >
      {COMMENT_REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          role="menuitem"
          className="thread-react-orb"
          onClick={() => onReact(emoji)}
          aria-label={reactionLabel(emoji, t.cardPage)}
          title={reactionLabel(emoji, t.cardPage)}
        >
          {COMMENT_REACTION_GLYPHS[emoji]}
        </button>
      ))}
    </div>
  );
}

function ThreadActionList({
  isOwn,
  pinned,
  onReply,
  onCopy,
  onPin,
  onCreateCard,
  onEdit,
  onDelete,
}: {
  isOwn: boolean;
  pinned: boolean;
  onReply: () => void;
  onCopy: () => void;
  onPin: () => void;
  onCreateCard: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="thread-popover-list">
      <ThreadActionItem
        icon={<ReplyActionIcon />}
        label={t.cardPage.reply}
        onSelect={onReply}
      />
      <ThreadActionItem
        icon={<CopyActionIcon />}
        label={t.cardPage.copyMessage}
        onSelect={onCopy}
      />
      <ThreadActionItem
        icon={<PinActionIcon />}
        label={pinned ? t.cardPage.unpinMessage : t.cardPage.pinMessage}
        onSelect={onPin}
      />
      <ThreadActionItem
        icon={<TaskActionIcon />}
        label={t.cardPage.createCardFromMessage}
        onSelect={onCreateCard}
      />
      {isOwn ? (
        <>
          <div className="thread-popover-rule" />
          <ThreadActionItem
            icon={<EditActionIcon />}
            label={t.cardPage.editMessage}
            onSelect={onEdit}
          />
          <ThreadActionItem
            icon={<DeleteActionIcon />}
            label={t.cardPage.deleteMessage}
            onSelect={onDelete}
            danger
          />
        </>
      ) : null}
    </div>
  );
}

function ThreadActionItem({
  icon,
  label,
  onSelect,
  danger = false,
}: {
  icon: ReactNode;
  label: string;
  onSelect: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={danger ? "thread-popover-item is-danger" : "thread-popover-item"}
      onClick={onSelect}
    >
      <span className="thread-popover-ico">{icon}</span>
      {label}
    </button>
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
