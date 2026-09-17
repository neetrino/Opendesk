"use client";

import { useRef, useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DeleteActionIcon } from "@/components/thread-action-icons";
import { useI18n } from "@/i18n/provider";
import { deleteCardAction } from "@/lib/card-delete-action";

type CardDeleteControlProps = {
  boardId: string;
  cardId: string;
  disabled?: boolean;
  onDeleted: () => void;
  onError: (error: string) => void;
};

export function CardDeleteControl({
  boardId,
  cardId,
  disabled = false,
  onDeleted,
  onError,
}: CardDeleteControlProps) {
  const { t } = useI18n();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inFlightRef = useRef(false);

  function confirmDelete(): void {
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;
    setConfirmOpen(false);

    const formData = new FormData();
    formData.set("boardId", boardId);
    formData.set("cardId", cardId);

    startTransition(async () => {
      const response = await deleteCardAction(formData);
      if (!response.ok) {
        inFlightRef.current = false;
        onError(response.error);
        return;
      }
      onDeleted();
    });
  }

  return (
    <>
      <button
        type="button"
        className="sheet-icon-btn sheet-delete"
        disabled={disabled || isPending}
        aria-label={t.cardPage.deleteCard}
        title={t.cardPage.deleteCard}
        onClick={() => setConfirmOpen(true)}
      >
        <DeleteActionIcon size={18} />
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title={t.cardPage.deleteCardConfirm}
        description={t.cardPage.deleteCardConfirmHint}
        cancelLabel={t.cardPage.deleteCardCancel}
        confirmLabel={t.cardPage.deleteCardYes}
        icon={<DeleteActionIcon size={20} />}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
