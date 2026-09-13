"use client";

import { BoardSearchDockButton } from "@/components/board-search";
import { BoardSettingsSheet } from "@/components/board-settings-sheet";
import { MarkAllReadControl } from "@/components/mark-all-read-control";
import type { BoardParticipant } from "@/components/participants-panel";
import { useI18n } from "@/i18n/provider";

type BoardDockProps = {
  boardTitle: string;
  slug: string;
  joinToken: string;
  participants: BoardParticipant[];
  locale: string;
  displayName: string;
  isOwner: boolean;
  onStartCreate: () => void;
  onMarkAllRead?: () => void;
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
  boardTitle,
  slug,
  joinToken,
  participants,
  locale,
  displayName,
  isOwner,
  onStartCreate,
  onMarkAllRead,
}: BoardDockProps) {
  const { t } = useI18n();

  return (
    <div className="board-dock" role="toolbar" aria-label={t.board.dockAria}>
      <div className="board-dock-actions">
        <BoardSettingsSheet
          slug={slug}
          joinToken={joinToken}
          boardTitle={boardTitle}
          participants={participants}
          locale={locale}
          displayName={displayName}
          isOwner={isOwner}
        />
        <BoardSearchDockButton />
        <MarkAllReadControl
          visible={Boolean(onMarkAllRead)}
          onMarkAll={onMarkAllRead ?? noop}
          className="board-dock-search"
        />
        <button
          type="button"
          className="board-dock-primary"
          onClick={onStartCreate}
        >
          <PlusIcon />
          {t.board.newCard}
        </button>
      </div>
    </div>
  );
}

function noop(): void {
  return undefined;
}
