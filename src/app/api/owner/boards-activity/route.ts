import { NextResponse } from "next/server";
import { getAccount } from "@/lib/account-session";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Compact card cursors for the signed-in account's boards.
 */
export async function GET(): Promise<Response> {
  const account = await getAccount();
  if (!account) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const seats = await prisma.participant.findMany({
      where: {
        userId: account.id,
        board: { disabledAt: null },
      },
      select: { id: true, boardId: true },
    });
    if (seats.length === 0) {
      return NextResponse.json(
        { boards: [] },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const boardIds = seats.map((seat) => seat.boardId);
    const participantIds = seats.map((seat) => seat.id);
    const participantByBoard = new Map(seats.map((seat) => [seat.boardId, seat.id]));

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
      prisma.comment.groupBy({
        by: ["cardId"],
        where: {
          authorId: { notIn: participantIds },
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
        boards: boardIds.flatMap((boardId) => {
          const participantId = participantByBoard.get(boardId);
          if (!participantId) {
            return [];
          }
          return [
            {
              id: boardId,
              participantId,
              cards: (cardsByBoard.get(boardId) ?? []).map((card) => {
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
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    logger.error("boards activity failed", error);
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}
