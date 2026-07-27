"use client";

import { useState, useTransition } from "react";
import type { CardStatus } from "@prisma/client";
import { moveCardAction } from "@/lib/actions";
import { CARD_STATUSES } from "@/lib/constants";
import { useI18n } from "@/i18n/provider";

type MoveCardControlsProps = {
  boardId: string;
  cardId: string;
  currentStatus: CardStatus;
  onStatusChange: (cardId: string, status: CardStatus) => void;
  onStatusRollback: (
    cardId: string,
    status: CardStatus,
    error: string,
  ) => void;
};

export function MoveCardControls({
  boardId,
  cardId,
  currentStatus,
  onStatusChange,
  onStatusRollback,
}: MoveCardControlsProps) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onChange(status: CardStatus): void {
    if (status === currentStatus) {
      return;
    }

    const previousStatus = currentStatus;
    setError(null);
    const formData = new FormData();
    formData.set("boardId", boardId);
    formData.set("cardId", cardId);
    formData.set("status", status);

    startTransition(async () => {
      onStatusChange(cardId, status);
      const result = await moveCardAction(formData);
      if (!result.ok) {
        onStatusRollback(cardId, previousStatus, result.error);
        setError(result.error);
      }
    });
  }

  return (
    <div className="stage-move">
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
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
