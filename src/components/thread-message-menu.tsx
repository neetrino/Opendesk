"use client";

import type { ReactNode } from "react";
import { ThreadActionPopover } from "@/components/thread-action-popover";
import { DotsActionIcon, FaceActionIcon } from "@/components/thread-action-icons";
import type {
  CommentReactionEmoji,
  ThreadReactionCount,
} from "@/lib/comment-reactions";
import { useThreadLongPress } from "@/lib/use-thread-long-press";
import { useThreadPopover } from "@/lib/use-thread-popover";
import { useI18n } from "@/i18n/provider";

type ThreadMessageMenuProps = {
  children: ReactNode;
  disabled: boolean;
  isOwn: boolean;
  pinned: boolean;
  onReply: () => void;
  onReact: (emoji: CommentReactionEmoji) => void;
  onCopy: () => void;
  onPin: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCreateCard: () => void;
  reactions: ThreadReactionCount[];
};

export function ThreadMessageMenu({
  children,
  disabled,
  isOwn,
  pinned,
  onReply,
  onReact,
  onCopy,
  onPin,
  onEdit,
  onDelete,
  onCreateCard,
  reactions,
}: ThreadMessageMenuProps) {
  const popover = useThreadPopover();
  const longPress = useThreadLongPress(popover.openAtTrigger, !disabled);

  if (disabled) {
    return children;
  }

  function run(action: () => void): void {
    popover.close();
    action();
  }

  return (
    <div
      className={
        popover.open ? "thread-item-shell is-menu-open" : "thread-item-shell"
      }
      ref={(node) => {
        const bubble = node?.closest(".thread-item") ?? node;
        popover.refs.setReference(bubble);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        popover.openAtTrigger();
      }}
      {...longPress}
    >
      {children}
      <ThreadHoverChip
        open={popover.open}
        onOpen={popover.openAtTrigger}
      />
      {popover.open ? (
        <ThreadActionPopover
          context={popover.context}
          setFloating={popover.refs.setFloating}
          floatingStyles={popover.ready ? popover.floatingStyles : hiddenFloating}
          floatingProps={popover.getFloatingProps()}
          isOwn={isOwn}
          pinned={pinned}
          onReply={() => run(onReply)}
          onReact={(emoji) => run(() => onReact(emoji))}
          onCopy={() => run(onCopy)}
          onPin={() => run(onPin)}
          onCreateCard={() => run(onCreateCard)}
          onEdit={() => run(onEdit)}
          onDelete={() => run(onDelete)}
          reactions={reactions}
        />
      ) : null}
    </div>
  );
}

const hiddenFloating = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  visibility: "hidden" as const,
};

function ThreadHoverChip({
  open,
  onOpen,
}: {
  open: boolean;
  onOpen: () => void;
}) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      className="thread-hover-chip"
      aria-label={t.cardPage.messageActions}
      aria-expanded={open}
      aria-haspopup="menu"
      onClick={onOpen}
    >
      <FaceActionIcon size={16} />
      <DotsActionIcon size={16} />
    </button>
  );
}
