import "server-only";

import { ATTACHMENT_PUBLIC_SELECT } from "@/lib/attachments";
import {
  beforeCommentCursor,
  type CardThreadComment,
} from "@/lib/card-comment-view";
import { COMMENT_PAGE_SIZE } from "@/lib/constants";
import { sliceLoadedPage } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

export {
  beforeCommentCursor,
  cardCommentsResponseSchema,
  cardThreadCommentJsonSchema,
  parseThreadComment,
  serializeThreadComment,
  type CardThreadComment,
} from "@/lib/card-comment-view";

type CommentRow = {
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
  attachments: Array<{
    id: string;
    filename: string;
    contentType: string;
    byteSize: number;
    kind: "image" | "video" | "audio";
    createdAt: Date;
    commentId: string | null;
    authorId: string;
  }>;
};

export function mapCommentRow(row: CommentRow): CardThreadComment {
  return {
    id: row.id,
    cardId: row.cardId,
    authorId: row.authorId,
    body: row.body,
    createdAt: row.createdAt,
    author: row.author,
    attachments: row.attachments.map((attachment) => ({
      ...attachment,
    })),
  };
}

export async function loadCardCommentPage(input: {
  cardId: string;
  before?: { createdAt: Date; id: string } | null;
}): Promise<{
  comments: CardThreadComment[];
  nextCursor: string | null;
}> {
  const rows = await prisma.comment.findMany({
    where: {
      cardId: input.cardId,
      ...(input.before ? beforeCommentCursor(input.before) : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: COMMENT_PAGE_SIZE + 1,
    include: {
      author: {
        select: {
          id: true,
          boardId: true,
          displayName: true,
          createdAt: true,
        },
      },
      attachments: {
        orderBy: { createdAt: "asc" },
        select: ATTACHMENT_PUBLIC_SELECT,
      },
    },
  });

  const { items, hasMore } = sliceLoadedPage(rows, COMMENT_PAGE_SIZE);
  const chronological = items.slice().reverse();
  const oldest = chronological[0];

  return {
    comments: chronological.map(mapCommentRow),
    nextCursor: hasMore && oldest ? oldest.id : null,
  };
}
