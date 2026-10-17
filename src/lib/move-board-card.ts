import type { CardStatus, Prisma } from "@prisma/client";
import {
  computeMovedCardPosition,
  planDestinationShift,
  type DestinationShift,
  type MovePlacement,
} from "@/lib/card-position";
import { prisma } from "@/lib/prisma";

/**
 * Move one card on a board. Placement `start` puts it at the top of the column.
 */
export async function moveBoardCard(input: {
  boardId: string;
  cardId: string;
  status: CardStatus;
  placement: MovePlacement;
}): Promise<"ok" | "not_found"> {
  const card = await prisma.card.findFirst({
    where: { id: input.cardId, boardId: input.boardId },
  });
  if (!card) {
    return "not_found";
  }

  const destination = await prisma.card.findMany({
    where: {
      boardId: input.boardId,
      OR: [{ status: input.status }, { id: card.id }],
    },
    select: { id: true, status: true, position: true },
  });
  const targetPosition = computeMovedCardPosition({
    moving: card,
    destination,
    toStatus: input.status,
    placement: input.placement,
  });

  const shift = planDestinationShift(card, input.status, targetPosition);
  await applyCardMove(input.boardId, card.id, input.status, targetPosition, shift);
  return "ok";
}

async function applyCardMove(
  boardId: string,
  cardId: string,
  status: CardStatus,
  targetPosition: number,
  shift: DestinationShift,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await shiftNeighbors(tx, boardId, cardId, status, shift);
    await tx.card.update({
      where: { id: cardId },
      data: { status, position: targetPosition },
    });
  });
}

async function shiftNeighbors(
  tx: Prisma.TransactionClient,
  boardId: string,
  cardId: string,
  status: CardStatus,
  shift: DestinationShift,
): Promise<void> {
  if (shift.kind === "increment") {
    await tx.card.updateMany({
      where: {
        boardId,
        status,
        id: { not: cardId },
        position: {
          gte: shift.from,
          ...(shift.toExclusive === undefined ? {} : { lt: shift.toExclusive }),
        },
      },
      data: { position: { increment: 1 } },
    });
  }
  if (shift.kind === "decrement") {
    await tx.card.updateMany({
      where: {
        boardId,
        status,
        id: { not: cardId },
        position: { gt: shift.fromExclusive, lte: shift.to },
      },
      data: { position: { decrement: 1 } },
    });
  }
}
