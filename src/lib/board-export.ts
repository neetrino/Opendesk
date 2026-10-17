import type { CardStatus } from "@prisma/client";
import {
  MAX_EXPORT_COMMENTS_PER_CARD,
  type BoardExportAttachment,
  type BoardExportCard,
  type BoardExportSnapshot,
} from "@/lib/board-export-format";
import { prisma } from "@/lib/prisma";

type ExportCommentRow = {
  body: string;
  createdAt: Date;
  editedAt: Date | null;
  parentAuthorName: string | null;
  parentExcerpt: string | null;
  author: { displayName: string };
  attachments: BoardExportAttachment[];
};

type ExportCardRow = {
  id: string;
  title: string;
  status: CardStatus;
  urgent: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  author: { displayName: string };
  labels: { label: { name: string; position: number } }[];
  comments: ExportCommentRow[];
};

/**
 * Full owner snapshot of one board: every task, its labels, and its chat.
 * Returns null when the board does not exist.
 */
export async function loadBoardExport(
  boardId: string,
  exportedAt: Date = new Date(),
): Promise<BoardExportSnapshot | null> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: {
      id: true,
      title: true,
      labels: {
        orderBy: { position: "asc" },
        select: { name: true },
      },
      cards: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: exportCardSelect,
      },
    },
  });

  if (!board) {
    return null;
  }

  return {
    boardId: board.id,
    title: board.title,
    exportedAt,
    labels: board.labels,
    cards: board.cards.map(toExportCard),
  };
}

/** One task and its chat, for an agent that already has the board id. */
export async function loadCardExport(
  boardId: string,
  cardId: string,
): Promise<{ title: string; card: BoardExportCard } | null> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { title: true },
  });
  if (!board) {
    return null;
  }
  const card = await prisma.card.findFirst({
    where: { id: cardId, boardId },
    select: exportCardSelect,
  });
  if (!card) {
    return null;
  }
  return { title: board.title, card: toExportCard(card) };
}

const exportCardSelect = {
  id: true,
  title: true,
  status: true,
  urgent: true,
  position: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { displayName: true } },
  labels: {
    select: { label: { select: { name: true, position: true } } },
  },
  comments: {
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" as const },
    take: MAX_EXPORT_COMMENTS_PER_CARD + 1,
    select: {
      body: true,
      createdAt: true,
      editedAt: true,
      parentAuthorName: true,
      parentExcerpt: true,
      author: { select: { displayName: true } },
      attachments: {
        orderBy: { createdAt: "asc" as const },
        select: { filename: true, kind: true },
      },
    },
  },
};

function toExportCard(card: ExportCardRow): BoardExportCard {
  const truncated = card.comments.length > MAX_EXPORT_COMMENTS_PER_CARD;
  const newestFirst = truncated
    ? card.comments.slice(0, MAX_EXPORT_COMMENTS_PER_CARD)
    : card.comments;

  return {
    id: card.id,
    title: card.title,
    status: card.status,
    urgent: card.urgent,
    position: card.position,
    authorName: card.author.displayName,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    labels: labelNames(card.labels),
    comments: newestFirst.reverse().map(toExportComment),
    commentsTruncated: truncated,
  };
}

function labelNames(
  labels: ExportCardRow["labels"],
): string[] {
  return [...labels]
    .sort((left, right) => left.label.position - right.label.position)
    .map((item) => item.label.name);
}

function toExportComment(comment: ExportCommentRow): BoardExportCard["comments"][number] {
  return {
    authorName: comment.author.displayName,
    body: comment.body,
    createdAt: comment.createdAt,
    editedAt: comment.editedAt,
    parentAuthorName: comment.parentAuthorName,
    parentExcerpt: comment.parentExcerpt,
    attachments: comment.attachments,
  };
}
