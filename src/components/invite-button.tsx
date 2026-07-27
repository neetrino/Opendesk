"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/provider";

type InviteButtonProps = {
  joinToken: string;
  compact?: boolean;
};

export function InviteButton({
  joinToken,
  compact = false,
}: InviteButtonProps) {
  const { t } = useI18n();
  const [message, setMessage] = useState<string | null>(null);

  async function onInvite(): Promise<void> {
    setMessage(null);
    const url = `${window.location.origin}/join/${joinToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage(t.board.copied);
      window.setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage(url);
    }
  }

  return (
    <div className={compact ? "invite-actions compact" : "invite-actions"}>
      <button
        type="button"
        className="button button-invite"
        title={t.board.inviteHint}
        onClick={() => {
          void onInvite();
        }}
      >
        {message ?? t.board.invite}
      </button>
      {compact ? null : <p className="muted invite-hint">{t.board.inviteHint}</p>}
    </div>
  );
}
