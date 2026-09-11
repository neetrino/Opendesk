"use client";

import { useState } from "react";
import type { CardStatus } from "@prisma/client";
import { BoardSettingsSheet } from "@/components/board-settings-sheet";
import { QuickCreateCard } from "@/components/quick-create-card";
import type { BoardParticipant } from "@/components/participants-panel";
import { useI18n } from "@/i18n/provider";
import type { LocalBoardCard, LocalCardAuthor } from "@/lib/local-cards";

type BoardDockProps = {
  boardId: string;
  status: CardStatus;
  slug: string;
  joinToken: string;
  participants: BoardParticipant[];
  locale: string;
  currentUser: LocalCardAuthor;
  onLocalCreate: (card: LocalBoardCard) => void;
  onLocalConfirm: (tempId: string, card: LocalBoardCard) => void;
  onLocalRollback: (tempId: string, error: string) => void;
};

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BoardDock({
  boardId,
  status,
  slug,
  joinToken,
  participants,
  locale,
  currentUser,
  onLocalCreate,
  onLocalConfirm,
  onLocalRollback,
}: BoardDockProps) {
  const { t } = useI18n();
  const [creating, setCreating] = useState(false);

  return (
    <div className="board-dock" role="toolbar" aria-label={t.board.dockAria}>
      {creating ? (
        <QuickCreateCard
          boardId={boardId}
          status={status}
          currentUser={currentUser}
          layout="dock"
          onLocalCreate={onLocalCreate}
          onLocalConfirm={onLocalConfirm}
          onLocalRollback={onLocalRollback}
          onCancel={() => setCreating(false)}
        />
      ) : (
        <div className="board-dock-actions">
          <BoardSettingsSheet
            slug={slug}
            joinToken={joinToken}
            participants={participants}
            locale={locale}
          />
          <button
            type="button"
            className="board-dock-primary"
            onClick={() => setCreating(true)}
          >
            <PlusIcon />
            {t.board.newCard}
          </button>
        </div>
      )}
    </div>
  );
}
