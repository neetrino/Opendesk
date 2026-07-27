"use client";

import { useState, useTransition } from "react";
import { createInviteLinkAction } from "@/lib/actions";
import { useI18n } from "@/i18n/provider";

type InviteButtonProps = {
  boardId: string;
  compact?: boolean;
};

export function InviteButton({ boardId, compact = false }: InviteButtonProps) {
  const { t } = useI18n();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onInvite(): void {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const response = await createInviteLinkAction(boardId);
      if (!response.ok) {
        setError(response.error);
        return;
      }

      const url = `${window.location.origin}/invite/${response.data.token}`;
      try {
        await navigator.clipboard.writeText(url);
        setMessage(t.board.copied);
        window.setTimeout(() => setMessage(null), 2000);
      } catch {
        setMessage(url);
      }
    });
  }

  return (
    <div className={compact ? "invite-actions compact" : "invite-actions"}>
      <button
        type="button"
        className="button button-invite"
        onClick={onInvite}
        disabled={isPending}
      >
        {isPending ? t.board.inviting : message ?? t.board.invite}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
