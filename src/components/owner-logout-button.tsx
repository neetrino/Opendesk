"use client";

import { type FormEvent } from "react";
import { logoutOwnerAction } from "@/lib/actions";
import { useI18n } from "@/i18n/provider";

type OwnerLogoutButtonProps = {
  confirmMessage?: string;
  label?: string;
};

export function OwnerLogoutButton({
  confirmMessage,
  label,
}: OwnerLogoutButtonProps) {
  const { t } = useI18n();

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
      <button type="submit" className="board-logout-btn">
        {label ?? t.boardsPage.logout}
      </button>
    </form>
  );
}
