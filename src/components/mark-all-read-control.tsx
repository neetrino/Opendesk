"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CheckReadIcon, MarkReadButton } from "@/components/mark-read-button";
import { useI18n } from "@/i18n/provider";

type MarkAllReadControlProps = {
  visible: boolean;
  onMarkAll: () => void;
  className?: string;
  showLabel?: boolean;
};

export function MarkAllReadControl({
  visible,
  onMarkAll,
  className,
  showLabel = false,
}: MarkAllReadControlProps) {
  const { t } = useI18n();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!visible) {
    return null;
  }

  return (
    <>
      <MarkReadButton
        className={className}
        label={t.board.markAllRead}
        showLabel={showLabel}
        onClick={() => setConfirmOpen(true)}
      />
      <ConfirmDialog
        open={confirmOpen}
        title={t.board.markAllReadConfirm}
        description={t.board.markAllReadConfirmHint}
        cancelLabel={t.board.markAllReadCancel}
        confirmLabel={t.board.markAllReadYes}
        icon={<CheckReadIcon size={20} />}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          onMarkAll();
          setConfirmOpen(false);
        }}
      />
    </>
  );
}
