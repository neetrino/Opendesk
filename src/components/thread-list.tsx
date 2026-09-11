"use client";

import { useState } from "react";
import { MediaLightbox, MediaThumb, type MediaItem } from "@/components/media-thumb";
import {
  attachmentPublicPath,
} from "@/lib/attachments";
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

  if (comments.length === 0) {
    return <p className="muted thread-empty">{t.cardPage.emptyThread}</p>;
  }

  return (
    <>
      {comments.map((comment) => {
        const own = comment.author.id === currentUserId;
        const time = new Date(comment.createdAt).toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div
            key={comment.id}
            className={own ? "thread-item is-own" : "thread-item"}
          >
            {own ? null : (
              <span className="thread-author">{comment.author.displayName}</span>
            )}
            {comment.body ? <p>{comment.body}</p> : null}
            {comment.attachments.length > 0 ? (
              <div className="thread-media">
                {comment.attachments.map((attachment) => {
                  const item = toItem(attachment);
                  return (
                    <MediaThumb
                      key={attachment.id}
                      item={item}
                      onOpen={() => setOpenItem(item)}
                      openLabel={t.cardPage.attachmentOpen}
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
      })}
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
