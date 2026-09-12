"use client";

import { useId, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LogoutIcon } from "@/components/logout-icon";
import { logoutOwnerAction } from "@/lib/actions";
import { useI18n } from "@/i18n/provider";

type OwnerLogoutButtonProps = {
  confirmMessage?: string;
  label?: string;
  iconOnly?: boolean;
};

export function OwnerLogoutButton({
  confirmMessage,
  label,
  iconOnly = false,
}: OwnerLogoutButtonProps) {
  const { t } = useI18n();
  const formId = `logout-form-${useId().replaceAll(":", "")}`;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const logoutLabel = label ?? t.boardsPage.logout;

  return (
    <>
      <form id={formId} action={logoutOwnerAction} className="board-logout">
        <button
          type="button"
          className={iconOnly ? "board-logout-btn is-icon" : "board-logout-btn"}
          aria-label={iconOnly ? logoutLabel : undefined}
          title={iconOnly ? logoutLabel : undefined}
          onClick={() => setConfirmOpen(true)}
        >
          {iconOnly ? <LogoutIcon /> : logoutLabel}
        </button>
      </form>
      <ConfirmDialog
        open={confirmOpen}
        title={confirmMessage ?? t.boardsPage.logoutConfirm}
        description={t.boardsPage.logoutConfirmHint}
        cancelLabel={t.boardsPage.logoutCancel}
        confirmLabel={logoutLabel}
        confirmFormId={formId}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
