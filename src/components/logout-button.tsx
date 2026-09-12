"use client";

import { type FormEvent } from "react";
import { LogoutIcon } from "@/components/logout-icon";
import { logoutAction } from "@/lib/actions";
import { useI18n } from "@/i18n/provider";

type LogoutButtonProps = {
  iconOnly?: boolean;
};

export function LogoutButton({ iconOnly = false }: LogoutButtonProps) {
  const { t } = useI18n();

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    if (!window.confirm(t.board.logoutConfirm)) {
      event.preventDefault();
    }
  }

  return (
    <form action={logoutAction} className="board-logout" onSubmit={onSubmit}>
      <button
        type="submit"
        className={iconOnly ? "board-logout-btn is-icon" : "board-logout-btn"}
        aria-label={iconOnly ? t.board.logout : undefined}
        title={iconOnly ? t.board.logout : undefined}
      >
        {iconOnly ? <LogoutIcon /> : t.board.logout}
      </button>
    </form>
  );
}
