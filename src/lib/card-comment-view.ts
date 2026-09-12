import { z } from "zod";
import type { BoardAttachment } from "@/lib/local-cards";
import { toIsoDate } from "@/lib/pagination";

export type CardThreadComment = {
  id: string;
  cardId: string;
  authorId: string;
  body: string;
  createdAt: Date;
  author: {
    id: string;
    boardId: string;
    displayName: string;
    createdAt: Date;
  };
  attachments: BoardAttachment[];
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

export const cardThreadCommentJsonSchema = z.object({
  id: z.string().cuid(),
  cardId: z.string().cuid(),
  authorId: z.string().cuid(),
  body: z.string(),
  createdAt: z.string(),
  author: z.object({
    id: z.string().cuid(),
    boardId: z.string().cuid(),
    displayName: z.string(),
    createdAt: z.string(),
  }),
  attachments: z.array(commentAttachmentJsonSchema),
});

export const cardCommentsResponseSchema = z.object({
  comments: z.array(cardThreadCommentJsonSchema),
  nextCursor: z.string().cuid().nullable(),
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
    author: {
      id: comment.author.id,
      boardId: comment.author.boardId,
      displayName: comment.author.displayName,
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
