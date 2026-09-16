"use client";

import type { ReactNode } from "react";
import { ThreadActionPopover } from "@/components/thread-action-popover";
import { DotsActionIcon, FaceActionIcon } from "@/components/thread-action-icons";
import type { CommentReactionEmoji } from "@/lib/comment-reactions";
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
}: ThreadMessageMenuProps) {
  const popover = useThreadPopover(isOwn ? "bottom-start" : "bottom-end");
  const longPress = useThreadLongPress(popover.openAtPoint, !disabled);

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
      onContextMenu={(event) => {
        event.preventDefault();
        popover.openAtPoint({ x: event.clientX, y: event.clientY });
      }}
      {...longPress}
    >
      {children}
      <ThreadHoverChip
        open={popover.open}
        setReference={popover.refs.setReference}
        referenceProps={popover.getReferenceProps({
          onClick: () => openFromChip(popover),
        })}
      />
      {popover.open ? (
        <ThreadActionPopover
          context={popover.context}
          setFloating={popover.refs.setFloating}
          floatingStyles={popover.floatingStyles}
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
        />
      ) : null}
    </div>
  );
}

function openFromChip(popover: ReturnType<typeof useThreadPopover>): void {
  const node = popover.refs.domReference.current;
  if (node) {
    popover.refs.setPositionReference(node);
  }
  popover.openAtTrigger();
}

function ThreadHoverChip({
  open,
  setReference,
  referenceProps,
}: {
  open: boolean;
  setReference: (node: HTMLButtonElement | null) => void;
  referenceProps: Record<string, unknown>;
}) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      className="thread-hover-chip"
      aria-label={t.cardPage.messageActions}
      aria-expanded={open}
      aria-haspopup="menu"
      ref={setReference}
      {...referenceProps}
    >
      <FaceActionIcon size={16} />
      <DotsActionIcon size={16} />
    </button>
  );
}
