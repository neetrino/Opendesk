import { z } from "zod";
import {
  type CommentReactionEmoji,
  type ThreadReactionCount,
} from "@/lib/comment-reactions";
import { COMMENT_REACTION_EMOJIS } from "@/lib/constants";
import type { BoardAttachment } from "@/lib/local-cards";
import { toIsoDate } from "@/lib/pagination";

export type { CommentReactionEmoji, ThreadReactionCount };

export type ThreadReplyTo = {
  id: string;
  authorName: string;
  excerpt: string;
  deleted: boolean;
};

export type ThreadCommentPreview = {
  id: string;
  authorName: string;
  excerpt: string;
};

export type CardThreadComment = {
  id: string;
  cardId: string;
  authorId: string;
  body: string;
  createdAt: Date;
  editedAt: Date | null;
  deleted: boolean;
  author: {
    id: string;
    boardId: string;
    displayName: string;
    avatarKey: string | null;
    createdAt: Date;
  };
  attachments: BoardAttachment[];
  replyTo: ThreadReplyTo | null;
  reactions: ThreadReactionCount[];
};

const commentAttachmentJsonSchema = z.object({
  id: z.string().cuid(),
  filename: z.string(),
  contentType: z.string(),
  byteSize: z.number().int(),
  kind: z.enum(["image", "video", "audio"]),
  createdAt: z.string(),
  commentId: z.string().nullable(),
  authorId: z.string().cuid(),
});

const reactionJsonSchema = z.object({
  emoji: z.enum(COMMENT_REACTION_EMOJIS),
  count: z.number().int().positive(),
  reactedByMe: z.boolean(),
});

const replyToJsonSchema = z.object({
  id: z.string().cuid(),
  authorName: z.string(),
  excerpt: z.string(),
  deleted: z.boolean(),
});

const previewJsonSchema = z.object({
  id: z.string().cuid(),
  authorName: z.string(),
  excerpt: z.string(),
});

export const cardThreadCommentJsonSchema = z.object({
  id: z.string().cuid(),
  cardId: z.string().cuid(),
  authorId: z.string().cuid(),
  body: z.string(),
  createdAt: z.string(),
  editedAt: z.string().nullable(),
  deleted: z.boolean(),
  author: z.object({
    id: z.string().cuid(),
    boardId: z.string().cuid(),
    displayName: z.string(),
    avatarKey: z.string().nullable(),
    createdAt: z.string(),
  }),
  attachments: z.array(commentAttachmentJsonSchema),
  replyTo: replyToJsonSchema.nullable(),
  reactions: z.array(reactionJsonSchema),
});

export const cardCommentsResponseSchema = z.object({
  comments: z.array(cardThreadCommentJsonSchema),
  nextCursor: z.string().cuid().nullable(),
  pinned: previewJsonSchema.nullable(),
  openQuestions: z.array(previewJsonSchema),
});

export function beforeCommentCursor(cursor: { createdAt: Date; id: string }): {
  OR: Array<
    | { createdAt: { lt: Date } }
    | { AND: [{ createdAt: Date }, { id: { lt: string } }] }
  >;
} {
  return {
    OR: [
      { createdAt: { lt: cursor.createdAt } },
      { AND: [{ createdAt: cursor.createdAt }, { id: { lt: cursor.id } }] },
    ],
  };
}

export function serializeThreadComment(comment: CardThreadComment): z.infer<
  typeof cardThreadCommentJsonSchema
> {
  return {
    id: comment.id,
    cardId: comment.cardId,
    authorId: comment.authorId,
    body: comment.body,
    createdAt: toIsoDate(comment.createdAt),
    editedAt: comment.editedAt ? toIsoDate(comment.editedAt) : null,
    deleted: comment.deleted,
    author: {
      id: comment.author.id,
      boardId: comment.author.boardId,
      displayName: comment.author.displayName,
      avatarKey: comment.author.avatarKey,
      createdAt: toIsoDate(comment.author.createdAt),
    },
    attachments: comment.attachments.map((attachment) => ({
      id: attachment.id,
      filename: attachment.filename,
      contentType: attachment.contentType,
      byteSize: attachment.byteSize,
      kind: attachment.kind,
      createdAt: toIsoDate(attachment.createdAt),
      commentId: attachment.commentId,
      authorId: attachment.authorId,
    })),
    replyTo: comment.replyTo,
    reactions: comment.reactions,
  };
}

export function parseThreadComment(raw: unknown): CardThreadComment | null {
  const parsed = cardThreadCommentJsonSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }

  const comment = parsed.data;
  return {
    ...comment,
    createdAt: new Date(comment.createdAt),
    editedAt: comment.editedAt ? new Date(comment.editedAt) : null,
    author: {
      ...comment.author,
      createdAt: new Date(comment.author.createdAt),
    },
    attachments: comment.attachments.map((attachment) => ({
      ...attachment,
      createdAt: new Date(attachment.createdAt),
    })),
  };
}

export function parseThreadPreview(
  raw: unknown,
): ThreadCommentPreview | null {
  const parsed = previewJsonSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
