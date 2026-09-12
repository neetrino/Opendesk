"use client";

import { type FormEvent } from "react";
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
  const logoutLabel = label ?? t.boardsPage.logout;

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    if (!window.confirm(confirmMessage ?? t.boardsPage.logoutConfirm)) {
      event.preventDefault();
    }
  }

  return (
    <form
      action={logoutOwnerAction}
      className="board-logout"
      onSubmit={onSubmit}
    >
      <button
        type="submit"
        className={iconOnly ? "board-logout-btn is-icon" : "board-logout-btn"}
        aria-label={iconOnly ? logoutLabel : undefined}
        title={iconOnly ? logoutLabel : undefined}
      >
        {iconOnly ? <LogoutIcon /> : logoutLabel}
      </button>
    </form>
  );
}
