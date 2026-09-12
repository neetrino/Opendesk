"use client";

import { useState } from "react";
import { LinkIcon } from "@/components/link-icon";
import { useI18n } from "@/i18n/provider";
import { buildJoinPath } from "@/lib/join-url";

type InviteButtonProps = {
  slug: string;
  joinToken: string;
  compact?: boolean;
  iconOnly?: boolean;
};

export function InviteButton({
  slug,
  joinToken,
  compact = false,
  iconOnly = false,
}: InviteButtonProps) {
  const { t } = useI18n();
  const [message, setMessage] = useState<string | null>(null);

  async function onInvite(): Promise<void> {
    setMessage(null);
    const url = `${window.location.origin}${buildJoinPath(slug, joinToken)}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage(t.board.copied);
      window.setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage(url);
    }
  }

  const inviteLabel = message ?? t.board.invite;

  return (
    <div
      className={
        compact || iconOnly ? "invite-actions compact" : "invite-actions"
      }
    >
      <button
        type="button"
        className={iconOnly ? "button button-invite is-icon" : "button button-invite"}
        aria-label={iconOnly ? inviteLabel : undefined}
        title={message ?? t.board.inviteHint}
        onClick={() => {
          void onInvite();
        }}
      >
        {iconOnly ? <LinkIcon /> : inviteLabel}
      </button>
      {compact || iconOnly ? null : (
        <p className="muted invite-hint">{t.board.inviteHint}</p>
      )}
    </div>
  );
}
