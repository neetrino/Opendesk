import { NextResponse } from "next/server";
import { ensureOwnerParticipantsForBoards } from "@/lib/board-access";
import { logger } from "@/lib/logger";
import { getOwnerSession } from "@/lib/owner-session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Compact card cursors for the owner board list: new tasks and unread messages.
 */
export async function GET(): Promise<Response> {
  const owner = await getOwnerSession();
  if (!owner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const boards = await prisma.board.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    const boardIds = boards.map((board) => board.id);
    if (boardIds.length === 0) {
      return NextResponse.json(
        { boards: [] },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const ownerByBoard = await ensureOwnerParticipantsForBoards(boardIds);
    const ownerIds = [...new Set(ownerByBoard.values())];

    const [cards, latestForeign] = await Promise.all([
      prisma.card.findMany({
        where: { boardId: { in: boardIds } },
        select: {
          id: true,
          boardId: true,
          authorId: true,
          createdAt: true,
          status: true,
        },
      }),
      ownerIds.length === 0
        ? Promise.resolve([])
        : prisma.comment.groupBy({
            by: ["cardId"],
            where: {
              authorId: { notIn: ownerIds },
              card: { boardId: { in: boardIds } },
            },
            _max: { createdAt: true },
          }),
    ]);

    const lastForeignByCard = new Map<string, string>();
    for (const row of latestForeign) {
      const createdAt = row._max.createdAt;
      if (createdAt) {
        lastForeignByCard.set(row.cardId, createdAt.toISOString());
      }
    }

    const cardsByBoard = new Map<string, typeof cards>();
    for (const card of cards) {
      const current = cardsByBoard.get(card.boardId);
      if (current) {
        current.push(card);
      } else {
        cardsByBoard.set(card.boardId, [card]);
      }
    }

    return NextResponse.json(
      {
        boards: boards.flatMap((board) => {
          const participantId = ownerByBoard.get(board.id);
          if (!participantId) {
            return [];
          }

          return [
            {
              id: board.id,
              participantId,
              cards: (cardsByBoard.get(board.id) ?? []).map((card) => {
                const lastForeignCommentAt = lastForeignByCard.get(card.id);
                return {
                  id: card.id,
                  authorId: card.authorId,
                  createdAt: card.createdAt.toISOString(),
                  status: card.status,
                  ...(lastForeignCommentAt ? { lastForeignCommentAt } : {}),
                };
              }),
            },
          ];
        }),
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    logger.error("owner boards activity failed", error);
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}
