import type { CardStatus } from "@prisma/client";

export type PositionedCard = {
  id: string;
  status: CardStatus;
  position: number;
};

export type MovePlacement =
  | { kind: "start" }
  | { kind: "before"; cardId: string }
  | { kind: "after"; cardId: string };

export type DestinationShift =
  | { kind: "none" }
  | { kind: "increment"; from: number; toExclusive?: number }
  | { kind: "decrement"; fromExclusive: number; to: number };

/** Column order used by the board query: position, then id. */
export function compareCardsByPosition(
  left: PositionedCard,
  right: PositionedCard,
): number {
  if (left.position !== right.position) {
    return left.position - right.position;
  }
  if (left.id < right.id) {
    return -1;
  }
  if (left.id > right.id) {
    return 1;
  }
  return 0;
}

export function resolveMovePlacement(input: {
  beforeCardId?: string;
  afterCardId?: string;
}): MovePlacement {
  if (input.beforeCardId) {
    return { kind: "before", cardId: input.beforeCardId };
  }
  if (input.afterCardId) {
    return { kind: "after", cardId: input.afterCardId };
  }
  return { kind: "start" };
}

export function writeMovePlacement(
  formData: FormData,
  placement: MovePlacement,
): void {
  if (placement.kind === "before") {
    formData.set("beforeCardId", placement.cardId);
    return;
  }
  if (placement.kind === "after") {
    formData.set("afterCardId", placement.cardId);
  }
}

/**
 * Final integer position for a moved card. Missing anchors fall back to the
 * top of the destination column.
 */
export function computeMovedCardPosition(input: {
  moving: PositionedCard;
  destination: readonly PositionedCard[];
  toStatus: CardStatus;
  placement: MovePlacement;
}): number {
  const dest = input.destination
    .filter((card) => card.id !== input.moving.id)
    .slice()
    .sort(compareCardsByPosition);

  const placement = input.placement;
  let target = 0;
  if (placement.kind === "before") {
    const found = dest.find((card) => card.id === placement.cardId);
    target = found ? found.position : 0;
  } else if (placement.kind === "after") {
    const found = dest.find((card) => card.id === placement.cardId);
    target = found ? found.position + 1 : 0;
  }

  if (input.moving.status === input.toStatus && input.moving.position < target) {
    target -= 1;
  }

  return target;
}

export function planDestinationShift(
  moving: Pick<PositionedCard, "status" | "position">,
  toStatus: CardStatus,
  targetPosition: number,
): DestinationShift {
  if (moving.status === toStatus) {
    if (moving.position === targetPosition) {
      return { kind: "none" };
    }
    if (moving.position < targetPosition) {
      return {
        kind: "decrement",
        fromExclusive: moving.position,
        to: targetPosition,
      };
    }
    return {
      kind: "increment",
      from: targetPosition,
      toExclusive: moving.position,
    };
  }

  return { kind: "increment", from: targetPosition };
}

export function applyCardMove<T extends PositionedCard>(
  cards: readonly T[],
  input: {
    cardId: string;
    toStatus: CardStatus;
    placement: MovePlacement;
  },
): T[] {
  const moving = cards.find((card) => card.id === input.cardId);
  if (!moving) {
    return [...cards];
  }

  const destination = cards.filter(
    (card) => card.status === input.toStatus || card.id === moving.id,
  );
  const targetPosition = computeMovedCardPosition({
    moving,
    destination,
    toStatus: input.toStatus,
    placement: input.placement,
  });
  const shift = planDestinationShift(moving, input.toStatus, targetPosition);

  return cards.map((card) => {
    if (card.id === moving.id) {
      return { ...card, status: input.toStatus, position: targetPosition };
    }
    if (card.status !== input.toStatus) {
      return card;
    }
    if (shift.kind === "increment") {
      const belowExclusive = shift.toExclusive;
      if (
        card.position >= shift.from &&
        (belowExclusive === undefined || card.position < belowExclusive)
      ) {
        return { ...card, position: card.position + 1 };
      }
    }
    if (
      shift.kind === "decrement" &&
      card.position > shift.fromExclusive &&
      card.position <= shift.to
    ) {
      return { ...card, position: card.position - 1 };
    }
    return card;
  });
}
