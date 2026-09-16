import "server-only";

import { ATTACHMENT_PUBLIC_SELECT } from "@/lib/attachments";
import {
  beforeCommentCursor,
  type CardThreadComment,
  type ThreadCommentPreview,
} from "@/lib/card-comment-view";
import { commentExcerpt } from "@/lib/comment-excerpt";
import { selectOpenQuestions } from "@/lib/comment-questions";
import {
  aggregateReactions,
  type CommentReactionEmoji,
} from "@/lib/comment-reactions";
import { COMMENT_PAGE_SIZE, COMMENT_SEARCH_MIN_LENGTH } from "@/lib/constants";
import { sliceLoadedPage } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

export {
  beforeCommentCursor,
  cardCommentsResponseSchema,
  cardThreadCommentJsonSchema,
  parseThreadComment,
  serializeThreadComment,
  type CardThreadComment,
  type ThreadCommentPreview,
} from "@/lib/card-comment-view";

const commentAuthorSelect = {
  id: true,
  boardId: true,
  displayName: true,
  avatarKey: true,
  createdAt: true,
} as const;

type CommentReactionRow = {
  emoji: CommentReactionEmoji;
  participantId: string;
};

type CommentRow = {
  id: string;
  cardId: string;
  authorId: string;
  body: string;
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
  parentId: string | null;
  parentAuthorName: string | null;
  parentExcerpt: string | null;
  author: {
    id: string;
    boardId: string;
    displayName: string;
    avatarKey: string | null;
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
  reactions: CommentReactionRow[];
};

function mapCommentRow(
  row: CommentRow,
  viewerId: string,
  parentDeleted: boolean,
): CardThreadComment {
  const deleted = row.deletedAt !== null;
  return {
    id: row.id,
    cardId: row.cardId,
    authorId: row.authorId,
    body: deleted ? "" : row.body,
    createdAt: row.createdAt,
    editedAt: deleted ? null : row.editedAt,
    deleted,
    author: row.author,
    attachments: deleted
      ? []
      : row.attachments.map((attachment) => ({ ...attachment })),
    replyTo:
      row.parentId && row.parentAuthorName !== null
        ? {
            id: row.parentId,
            authorName: row.parentAuthorName,
            excerpt: row.parentExcerpt ?? "",
            deleted: parentDeleted,
          }
        : null,
    reactions: deleted ? [] : aggregateReactions(row.reactions, viewerId),
  };
}

function commentInclude() {
  return {
    author: { select: commentAuthorSelect },
    attachments: {
      orderBy: { createdAt: "asc" as const },
      select: ATTACHMENT_PUBLIC_SELECT,
    },
    reactions: {
      select: { emoji: true, participantId: true },
    },
  };
}

async function parentDeletedById(
  parentIds: string[],
): Promise<Set<string>> {
  if (parentIds.length === 0) {
    return new Set();
  }
  const parents = await prisma.comment.findMany({
    where: { id: { in: parentIds }, deletedAt: { not: null } },
    select: { id: true },
  });
  return new Set(parents.map((parent) => parent.id));
}

export async function loadCardThreadMeta(
  cardId: string,
): Promise<{
  pinned: ThreadCommentPreview | null;
  openQuestions: ThreadCommentPreview[];
}> {
  const [card, questioned, replies] = await Promise.all([
    prisma.card.findFirst({
      where: { id: cardId },
      select: {
        pinnedComment: {
          select: {
            id: true,
            body: true,
            deletedAt: true,
            author: { select: { displayName: true } },
          },
        },
      },
    }),
    prisma.comment.findMany({
      where: {
        cardId,
        deletedAt: null,
        reactions: { some: { emoji: "question" } },
      },
      select: {
        id: true,
        body: true,
        deletedAt: true,
        author: { select: { displayName: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.comment.findMany({
      where: {
        cardId,
        deletedAt: null,
        parentId: { not: null },
      },
      select: { parentId: true, deletedAt: true },
    }),
  ]);

  const open = selectOpenQuestions(
    questioned.map((comment) => ({
      id: comment.id,
      hasQuestion: true,
      deleted: comment.deletedAt !== null,
      authorName: comment.author.displayName,
      excerpt: commentExcerpt(comment.body),
    })),
    replies.map((reply) => ({
      parentId: reply.parentId,
      deleted: reply.deletedAt !== null,
    })),
  );

  const pinnedRow = card?.pinnedComment;
  const pinned =
    pinnedRow && pinnedRow.deletedAt === null
      ? {
          id: pinnedRow.id,
          authorName: pinnedRow.author.displayName,
          excerpt: commentExcerpt(pinnedRow.body),
        }
      : null;

  return {
    pinned,
    openQuestions: open.map((comment) => ({
      id: comment.id,
      authorName: comment.authorName,
      excerpt: comment.excerpt,
    })),
  };
}

export async function loadCardCommentPage(input: {
  cardId: string;
  viewerId: string;
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
    include: commentInclude(),
  });

  const { items, hasMore } = sliceLoadedPage(rows, COMMENT_PAGE_SIZE);
  const chronological = items.slice().reverse();
  const oldest = chronological[0];
  const deletedParents = await parentDeletedById(
    chronological.flatMap((row) => (row.parentId ? [row.parentId] : [])),
  );

  return {
    comments: chronological.map((row) =>
      mapCommentRow(
        row,
        input.viewerId,
        row.parentId ? deletedParents.has(row.parentId) : false,
      ),
    ),
    nextCursor: hasMore && oldest ? oldest.id : null,
  };
}

export async function searchCardComments(input: {
  cardId: string;
  viewerId: string;
  query: string;
}): Promise<CardThreadComment[]> {
  const query = input.query.trim();
  if (query.length < COMMENT_SEARCH_MIN_LENGTH) {
    return [];
  }

  const rows = await prisma.comment.findMany({
    where: {
      cardId: input.cardId,
      deletedAt: null,
      body: { contains: query, mode: "insensitive" },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: COMMENT_PAGE_SIZE,
    include: commentInclude(),
  });

  const deletedParents = await parentDeletedById(
    rows.flatMap((row) => (row.parentId ? [row.parentId] : [])),
  );

  return rows
    .slice()
    .reverse()
    .map((row) =>
      mapCommentRow(
        row,
        input.viewerId,
        row.parentId ? deletedParents.has(row.parentId) : false,
      ),
    );
}
