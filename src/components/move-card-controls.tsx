"use client";

import { useTransition } from "react";
import type { CardStatus } from "@prisma/client";
import { moveCardAction } from "@/lib/actions";
import { CARD_STATUSES } from "@/lib/constants";
import { useI18n } from "@/i18n/provider";

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
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  function onChange(status: CardStatus): void {
    if (status === currentStatus) {
      return;
    }
    const formData = new FormData();
    formData.set("boardId", boardId);
    formData.set("cardId", cardId);
    formData.set("status", status);
    startTransition(async () => {
      await moveCardAction(formData);
    });
  }

  return (
    <div className="stage-pills" role="group" aria-label={t.common.stageAria}>
      {CARD_STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          className={
            status === currentStatus
              ? `stage-pill is-active stage-${status}`
              : `stage-pill stage-${status}`
          }
          disabled={isPending || status === currentStatus}
          onClick={() => onChange(status)}
        >
          {t.columns[status]}
        </button>
      ))}
    </div>
  );
}
