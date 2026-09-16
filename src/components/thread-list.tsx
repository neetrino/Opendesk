"use client";

import { useState } from "react";
import { MediaLightbox, MediaThumb, type MediaItem } from "@/components/media-thumb";
import { ThreadBody, type ThreadLinkCopy } from "@/components/thread-body";
import { attachmentPublicPath } from "@/lib/attachments";
import type { BoardAttachment } from "@/lib/local-cards";
import { useI18n } from "@/i18n/provider";

export type ThreadAttachment = BoardAttachment & {
  previewUrl?: string;
};

type ThreadComment = {
  id: string;
  body: string;
  createdAt: Date;
  author: { id: string; displayName: string };
  attachments: ThreadAttachment[];
};

type ThreadListProps = {
  comments: ThreadComment[];
  locale: string;
  currentUserId: string;
};

function toItem(attachment: ThreadAttachment): MediaItem {
  return {
    id: attachment.id,
    filename: attachment.filename,
    contentType: attachment.contentType,
    kind: attachment.kind,
    src: attachment.previewUrl ?? attachmentPublicPath(attachment.id),
  };
}

export function ThreadList({ comments, locale, currentUserId }: ThreadListProps) {
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

  if (comments.length === 0) {
    return <p className="muted thread-empty">{t.cardPage.emptyThread}</p>;
  }

  return (
    <>
      {comments.map((comment) => (
        <ThreadCommentItem
          key={comment.id}
          comment={comment}
          locale={locale}
          isOwn={comment.author.id === currentUserId}
          linkCopy={linkCopy}
          openLabel={t.cardPage.attachmentOpen}
          onOpen={setOpenItem}
        />
      ))}
      {openItem ? (
        <MediaLightbox
          item={openItem}
          closeLabel={t.cardPage.attachmentClosePreview}
          onClose={() => setOpenItem(null)}
        />
      ) : null}
    </>
  );
}

function ThreadCommentItem({
  comment,
  locale,
  isOwn,
  linkCopy,
  openLabel,
  onOpen,
}: {
  comment: ThreadComment;
  locale: string;
  isOwn: boolean;
  linkCopy: ThreadLinkCopy;
  openLabel: string;
  onOpen: (item: MediaItem) => void;
}) {
  const time = new Date(comment.createdAt).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={isOwn ? "thread-item is-own" : "thread-item"}>
      {isOwn ? null : (
        <span className="thread-author">{comment.author.displayName}</span>
      )}
      {comment.body ? <ThreadBody body={comment.body} copy={linkCopy} /> : null}
      {comment.attachments.length > 0 ? (
        <div className="thread-media">
          {comment.attachments.map((attachment) => {
            const item = toItem(attachment);
            return (
              <MediaThumb
                key={attachment.id}
                item={item}
                onOpen={() => onOpen(item)}
                openLabel={openLabel}
              />
            );
          })}
        </div>
      ) : null}
      <time className="thread-time" dateTime={new Date(comment.createdAt).toISOString()}>
        {time}
      </time>
    </div>
  );
}
