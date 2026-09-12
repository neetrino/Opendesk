"use client";

import { useId, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LogoutIcon } from "@/components/logout-icon";
import { logoutAction } from "@/lib/actions";
import { useI18n } from "@/i18n/provider";

type LogoutButtonProps = {
  iconOnly?: boolean;
};

export function LogoutButton({ iconOnly = false }: LogoutButtonProps) {
  const { t } = useI18n();
  const formId = `logout-form-${useId().replaceAll(":", "")}`;
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <form id={formId} action={logoutAction} className="board-logout">
        <button
          type="button"
          className={iconOnly ? "board-logout-btn is-icon" : "board-logout-btn"}
          aria-label={iconOnly ? t.board.logout : undefined}
          title={iconOnly ? t.board.logout : undefined}
          onClick={() => setConfirmOpen(true)}
        >
          {iconOnly ? <LogoutIcon /> : t.board.logout}
        </button>
      </form>
      <ConfirmDialog
        open={confirmOpen}
        title={t.board.logoutConfirm}
        description={t.board.logoutConfirmHint}
        cancelLabel={t.board.logoutCancel}
        confirmLabel={t.board.logout}
        confirmFormId={formId}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
