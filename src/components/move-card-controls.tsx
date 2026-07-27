"use client";

import { useTransition } from "react";
import type { CardStatus } from "@prisma/client";
import { moveCardAction } from "@/lib/actions";
import { CARD_COLUMNS } from "@/lib/constants";

type MoveCardControlsProps = {
  boardId: string;
  cardId: string;
  currentStatus: CardStatus;
};

export function MoveCardControls({
  boardId,
  cardId,
  currentStatus,
}: MoveCardControlsProps) {
  const [isPending, startTransition] = useTransition();

  function moveTo(status: CardStatus): void {
    const formData = new FormData();
    formData.set("boardId", boardId);
    formData.set("cardId", cardId);
    formData.set("status", status);
    startTransition(async () => {
      await moveCardAction(formData);
    });
  }

  return (
    <div className="move-controls">
      {CARD_COLUMNS.map((column) => (
        <button
          key={column.status}
          type="button"
          className={
            column.status === currentStatus
              ? "chip chip-active"
              : "chip"
          }
          disabled={isPending || column.status === currentStatus}
          onClick={() => moveTo(column.status)}
        >
          {column.label}
        </button>
      ))}
    </div>
  );
}
