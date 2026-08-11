"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/provider";
import { buildJoinPath } from "@/lib/join-url";

type BoardListItemProps = {
  title: string;
  slug: string;
  joinToken: string;
  createdAtLabel: string;
};

export function BoardListItem({
  title,
  slug,
  joinToken,
  createdAtLabel,
}: BoardListItemProps) {
  const { t } = useI18n();
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const path = buildJoinPath(slug, joinToken);

  async function copyLink(): Promise<void> {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyMessage(t.board.copied);
      window.setTimeout(() => setCopyMessage(null), 2000);
    } catch {
      setCopyMessage(url);
    }
  }

  return (
    <li className="boards-list-item">
      <div className="boards-list-main">
        <h2>{title}</h2>
        <p className="muted">
          {t.boardsPage.createdAt} {createdAtLabel}
        </p>
        <p className="boards-list-path muted">{path}</p>
      </div>
      <div className="boards-list-actions">
        <a className="button" href={path}>
          {t.boardsPage.openBoard}
        </a>
        <button
          type="button"
          className="button-secondary"
          onClick={() => {
            void copyLink();
          }}
        >
          {copyMessage ?? t.boardsPage.copyLink}
        </button>
      </div>
    </li>
  );
}
