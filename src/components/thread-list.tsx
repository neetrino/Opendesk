"use client";

import { useState } from "react";
import { MediaLightbox, type MediaItem } from "@/components/media-thumb";
import { ThreadCommentItem } from "@/components/thread-comment-item";
import type { ThreadLinkCopy } from "@/components/thread-body";
import type { CardThreadComment } from "@/lib/card-comment-view";
import type { MentionParticipant } from "@/lib/comment-mentions";
import type { CommentReactionEmoji } from "@/lib/comment-reactions";
import { dayBreakForComment } from "@/lib/thread-day-breaks";
import { findFirstUnreadCommentId } from "@/lib/thread-unread";
import { useI18n } from "@/i18n/provider";

type ThreadListProps = {
  comments: CardThreadComment[];
  locale: string;
  currentUserId: string;
  participants: MentionParticipant[];
  pinnedCommentId: string | null;
  lastReadAt: Date | null;
  onReply: (comment: CardThreadComment) => void;
  onReact: (commentId: string, emoji: CommentReactionEmoji) => void;
  onPin: (comment: CardThreadComment) => void;
  onEdit: (comment: CardThreadComment, body: string) => void;
  onDelete: (comment: CardThreadComment) => void;
  onCreateCard: (comment: CardThreadComment) => void;
};

export function ThreadList({
  comments,
  locale,
  currentUserId,
  participants,
  pinnedCommentId,
  lastReadAt,
  onReply,
  onReact,
  onPin,
  onEdit,
  onDelete,
  onCreateCard,
}: ThreadListProps) {
  const { t } = useI18n();
  const [openItem, setOpenItem] = useState<MediaItem | null>(null);
  const linkCopy: ThreadLinkCopy = {
    openLink: t.cardPage.openCommentLink,
    figmaLabel: t.cardPage.figmaLabel,
    figmaOpenAria: t.cardPage.figmaOpenAria,
    figmaDesign: t.cardPage.figmaDesign,
    figmaPrototype: t.cardPage.figmaPrototype,
    figmaBoard: t.cardPage.figmaBoard,
    figmaFile: t.cardPage.figmaFile,
  };
  const unreadId = findFirstUnreadCommentId(
    comments,
    lastReadAt,
    currentUserId,
  );

  if (comments.length === 0) {
    return <p className="muted thread-empty">{t.cardPage.emptyThread}</p>;
  }

  return (
    <>
      {comments.map((comment, index) => {
        const previous = comments[index - 1] ?? null;
        const dayBreak = dayBreakForComment(
          comment.createdAt,
          previous?.createdAt ?? null,
          locale,
          new Date(),
          {
            today: t.cardPage.threadToday,
            yesterday: t.cardPage.threadYesterday,
          },
        );
        return (
          <div key={comment.id}>
            {dayBreak ? <p className="thread-day">{dayBreak.label}</p> : null}
            {comment.id === unreadId ? (
              <p className="thread-new">{t.cardPage.newMessages}</p>
            ) : null}
            <ThreadCommentItem
              comment={comment}
              locale={locale}
              isOwn={comment.author.id === currentUserId}
              pinned={pinnedCommentId === comment.id}
              linkCopy={linkCopy}
              participants={participants}
              openLabel={t.cardPage.attachmentOpen}
              onOpen={setOpenItem}
              onReply={() => onReply(comment)}
              onReact={(emoji) => onReact(comment.id, emoji)}
              onPin={() => onPin(comment)}
              onEdit={(body) => onEdit(comment, body)}
              onDelete={() => onDelete(comment)}
              onCreateCard={() => onCreateCard(comment)}
            />
          </div>
        );
      })}
      {openItem ? (
        <MediaLightbox
          key={openItem.id}
          item={openItem}
          closeLabel={t.cardPage.attachmentClosePreview}
          zoomInLabel={t.cardPage.attachmentZoomIn}
          zoomOutLabel={t.cardPage.attachmentZoomOut}
          zoomSliderLabel={t.cardPage.attachmentZoomSlider}
          downloadLabel={t.cardPage.attachmentDownload}
          onClose={() => setOpenItem(null)}
        />
      ) : null}
    </>
  );
}
