import {
  BoardSearchField,
  BoardSearchProvider,
} from "@/components/board-search";
import { InviteButton } from "@/components/invite-button";
import { KanbanBoard, type BoardCard } from "@/components/kanban-board";
import type { BoardColumnPages } from "@/lib/board-card-view";
import { LogoutButton } from "@/components/logout-button";
import { OwnerLogoutButton } from "@/components/owner-logout-button";
import { ParticipantsPanel } from "@/components/participants-panel";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import { displayInitials } from "@/lib/initials";

type BoardWorkspaceParticipant = {
  id: string;
  displayName: string;
  createdAt: Date;
};

type BoardWorkspaceProps = {
  board: {
    id: string;
    title: string;
    slug: string;
    joinToken: string;
    participants: BoardWorkspaceParticipant[];
    cards: BoardCard[];
    columnPages: BoardColumnPages;
  };
  locale: Locale;
  t: Dictionary;
  currentUser: {
    participantId: string;
    displayName: string;
  };
  isOwner: boolean;
  attachmentsEnabled: boolean;
};

export function BoardWorkspace({
  board,
  locale,
  t,
  currentUser,
  isOwner,
  attachmentsEnabled,
}: BoardWorkspaceProps) {
  return (
    <BoardSearchProvider>
      <section className="board-page">
        <header className="board-top">
          <div className="board-top-main">
            <h1>{board.title}</h1>
            <p className="board-identity">
              <span className="board-avatar" aria-hidden="true">
                {displayInitials(currentUser.displayName)}
              </span>
              <span>
                {t.board.youAre}{" "}
                <strong>{currentUser.displayName}</strong>
              </span>
            </p>
          </div>
          <BoardSearchField />
          <div className="board-top-actions">
            <ParticipantsPanel
              participants={board.participants}
              locale={locale}
            />
            <InviteButton slug={board.slug} joinToken={board.joinToken} compact />
          </div>
          {isOwner ? <OwnerLogoutButton /> : <LogoutButton />}
        </header>
        <KanbanBoard
          boardId={board.id}
          boardTitle={board.title}
          cards={board.cards}
          columnPages={board.columnPages}
          locale={locale}
          currentUser={currentUser}
          isOwner={isOwner}
          attachmentsEnabled={attachmentsEnabled}
          slug={board.slug}
          joinToken={board.joinToken}
          participants={board.participants}
        />
      </section>
    </BoardSearchProvider>
  );
}
