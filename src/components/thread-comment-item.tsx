"use client";

import { useState } from "react";
import { MediaThumb, type MediaItem } from "@/components/media-thumb";
import { ThreadBody, type ThreadLinkCopy } from "@/components/thread-body";
import { ThreadMessageMenu } from "@/components/thread-message-menu";
import { attachmentPublicPath } from "@/lib/attachments";
import type { CardThreadComment } from "@/lib/card-comment-view";
import type { MentionParticipant } from "@/lib/comment-mentions";
import {
  COMMENT_REACTION_GLYPHS,
  type CommentReactionEmoji,
} from "@/lib/comment-reactions";
import type { BoardAttachment } from "@/lib/local-cards";
import { useI18n } from "@/i18n/provider";

function toItem(attachment: BoardAttachment): MediaItem {
  return {
    id: attachment.id,
    filename: attachment.filename,
    contentType: attachment.contentType,
    kind: attachment.kind,
    src: attachment.previewUrl ?? attachmentPublicPath(attachment.id),
  };
}

type ThreadCommentItemProps = {
  comment: CardThreadComment;
  locale: string;
  isOwn: boolean;
  pinned: boolean;
  linkCopy: ThreadLinkCopy;
  participants: MentionParticipant[];
  openLabel: string;
  onOpen: (item: MediaItem) => void;
  onReply: () => void;
  onReact: (emoji: CommentReactionEmoji) => void;
  onPin: () => void;
  onEdit: (body: string) => void;
  onDelete: () => void;
  onCreateCard: () => void;
};

export function ThreadCommentItem({
  comment,
  locale,
  isOwn,
  pinned,
  linkCopy,
  participants,
  openLabel,
  onOpen,
  onReply,
  onReact,
  onPin,
  onEdit,
  onDelete,
  onCreateCard,
}: ThreadCommentItemProps) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const time = new Date(comment.createdAt).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  async function copyBody(): Promise<void> {
    if (!comment.body) {
      return;
    }
    try {
      await navigator.clipboard.writeText(comment.body);
    } catch {
      // Clipboard can be denied; the action is still available next time.
    }
  }

  return (
    <div
      id={`thread-comment-${comment.id}`}
      className={isOwn ? "thread-item is-own" : "thread-item"}
    >
      <ThreadMessageMenu
        disabled={comment.deleted}
        isOwn={isOwn}
        pinned={pinned}
        onReply={onReply}
        onReact={onReact}
        onCopy={() => {
          void copyBody();
        }}
        onPin={onPin}
        onEdit={() => {
          setDraft(comment.body);
          setEditing(true);
        }}
        onDelete={onDelete}
        onCreateCard={onCreateCard}
        reactions={comment.reactions}
      >
        {isOwn || comment.deleted ? null : (
          <span className="thread-author">{comment.author.displayName}</span>
        )}
        {comment.replyTo ? (
          <p className="thread-reply-to">
            {t.cardPage.replyTo.replace("{name}", comment.replyTo.authorName)}
            {": "}
            {comment.replyTo.deleted
              ? t.cardPage.messageDeleted
              : comment.replyTo.excerpt}
          </p>
        ) : null}
        <ThreadCommentContent
          comment={comment}
          editing={editing}
          draft={draft}
          linkCopy={linkCopy}
          participants={participants}
          openLabel={openLabel}
          onOpen={onOpen}
          onDraftChange={setDraft}
          onCancelEdit={() => {
            setEditing(false);
            setDraft(comment.body);
          }}
          onSaveEdit={() => {
            const next = draft.trim();
            if (next.length === 0) {
              return;
            }
            onEdit(next);
            setEditing(false);
          }}
        />
        {comment.reactions.length > 0 && !comment.deleted ? (
          <ThreadReactionChips
            reactions={comment.reactions}
            onReact={onReact}
          />
        ) : null}
        <div className="thread-meta">
          <time dateTime={new Date(comment.createdAt).toISOString()}>
            {time}
            {comment.editedAt ? ` · ${t.cardPage.edited}` : ""}
          </time>
        </div>
      </ThreadMessageMenu>
    </div>
  );
}

function ThreadReactionChips({
  reactions,
  onReact,
}: {
  reactions: CardThreadComment["reactions"];
  onReact: (emoji: CommentReactionEmoji) => void;
}) {
  return (
    <div className="thread-reactions">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          className={
            reaction.reactedByMe ? "thread-reaction is-mine" : "thread-reaction"
          }
          onClick={() => onReact(reaction.emoji)}
        >
          {COMMENT_REACTION_GLYPHS[reaction.emoji]} {reaction.count}
        </button>
      ))}
    </div>
  );
}

function ThreadCommentContent({
  comment,
  editing,
  draft,
  linkCopy,
  participants,
  openLabel,
  onOpen,
  onDraftChange,
  onCancelEdit,
  onSaveEdit,
}: {
  comment: CardThreadComment;
  editing: boolean;
  draft: string;
  linkCopy: ThreadLinkCopy;
  participants: MentionParticipant[];
  openLabel: string;
  onOpen: (item: MediaItem) => void;
  onDraftChange: (value: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
}) {
  const { t } = useI18n();
  if (comment.deleted) {
    return <p className="thread-deleted">{t.cardPage.messageDeleted}</p>;
  }
  if (editing) {
    return (
      <div className="thread-edit">
        <textarea
          value={draft}
          maxLength={2000}
          onChange={(event) => onDraftChange(event.target.value)}
        />
        <div className="thread-edit-actions">
          <button type="button" onClick={onCancelEdit}>
            {t.cardPage.cancelEdit}
          </button>
          <button type="button" onClick={onSaveEdit}>
            {t.cardPage.saveEdit}
          </button>
        </div>
      </div>
    );
  }
  return (
    <>
      {comment.body ? (
        <ThreadBody
          body={comment.body}
          copy={linkCopy}
          participants={participants}
        />
      ) : null}
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
    </>
  );
}
