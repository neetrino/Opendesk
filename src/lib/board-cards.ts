import "server-only";

import type { CardStatus } from "@prisma/client";
import { mapBoardLabelRow } from "@/lib/board-labels";
import {
  afterCardCursor,
  emptyColumnPages,
  encodeCardCursor,
  type BoardColumnPages,
} from "@/lib/board-card-view";
import { CARD_STATUSES, COLUMN_PAGE_SIZE } from "@/lib/constants";
import type { LocalBoardCard } from "@/lib/local-cards";
import { sliceLoadedPage } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

const boardCardListSelect = {
  id: true,
  boardId: true,
  authorId: true,
  status: true,
  title: true,
  urgent: true,
  position: true,
  createdAt: true,
  updatedAt: true,
  pinnedCommentId: true,
  author: {
    select: {
      id: true,
      boardId: true,
      displayName: true,
      avatarKey: true,
      createdAt: true,
    },
  },
  labels: {
    select: {
      label: {
        select: {
          id: true,
          name: true,
          color: true,
          position: true,
        },
      },
    },
    orderBy: {
      label: {
        position: "asc",
      },
    },
  },
  _count: {
    select: {
      comments: true,
      attachments: {
        where: { commentId: null },
      },
    },
  },
} as const;

type BoardCardRow = {
  id: string;
  boardId: string;
  authorId: string;
  status: CardStatus;
  title: string;
  urgent: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  pinnedCommentId: string | null;
  author: {
    id: string;
    boardId: string;
    displayName: string;
    avatarKey: string | null;
    createdAt: Date;
  };
  labels: Array<{
    label: {
      id: string;
      name: string;
      color: string;
      position: number;
    };
  }>;
  _count: {
    comments: number;
    attachments: number;
  };
};

export function mapBoardCardRow(row: BoardCardRow): LocalBoardCard {
  return {
    id: row.id,
    boardId: row.boardId,
    authorId: row.authorId,
    status: row.status,
    title: row.title,
    urgent: row.urgent,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    pinnedCommentId: row.pinnedCommentId,
    author: row.author,
    commentCount: row._count.comments,
    attachmentCount: row._count.attachments,
    labels: row.labels.flatMap((item) => {
      const label = mapBoardLabelRow(item.label);
      return label ? [label] : [];
    }),
  };
}

export async function loadColumnCardPage(input: {
  boardId: string;
  status: CardStatus;
  cursor?: { position: number; id: string } | null;
}): Promise<{
  cards: LocalBoardCard[];
  nextCursor: string | null;
}> {
  const rows = await prisma.card.findMany({
    where: {
      boardId: input.boardId,
      status: input.status,
      ...(input.cursor ? afterCardCursor(input.cursor) : {}),
    },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    take: COLUMN_PAGE_SIZE + 1,
    select: boardCardListSelect,
  });

  const { items, hasMore } = sliceLoadedPage(rows, COLUMN_PAGE_SIZE);
  const cards = items.map(mapBoardCardRow);
  const last = cards[cards.length - 1];

  return {
    cards,
    nextCursor: hasMore && last ? encodeCardCursor(last) : null,
  };
}

export async function loadBoardCardPages(boardId: string): Promise<{
  cards: LocalBoardCard[];
  columns: BoardColumnPages;
}> {
  const [counts, ...pages] = await Promise.all([
    prisma.card.groupBy({
      by: ["status"],
      where: { boardId },
      _count: { id: true },
    }),
    ...CARD_STATUSES.map((status) =>
      loadColumnCardPage({ boardId, status }),
    ),
  ]);

  const columns = emptyColumnPages();
  for (const row of counts) {
    columns[row.status].totalCount = row._count.id;
  }

  CARD_STATUSES.forEach((status, index) => {
    const page = pages[index];
    if (!page) {
      return;
    }
    columns[status].nextCursor = page.nextCursor;
  });

  return {
    cards: pages.flatMap((page) => page.cards),
    columns,
  };
}
