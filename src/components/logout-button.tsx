"use client";

import { type FormEvent } from "react";
import { logoutAction } from "@/lib/actions";
import { useI18n } from "@/i18n/provider";

export function LogoutButton() {
  const { t } = useI18n();

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    if (!window.confirm(t.board.logoutConfirm)) {
      event.preventDefault();
    }
  }

  return (
    <form action={logoutAction} className="board-logout" onSubmit={onSubmit}>
      <button type="submit" className="board-logout-btn">
        {t.board.logout}
      </button>
    </form>
  );
}
