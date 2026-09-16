import {
  BoardSearchField,
  BoardSearchProvider,
} from "@/components/board-search";
import {
  BoardInboxControlProvider,
  BoardMarkAllHeaderButton,
} from "@/components/board-inbox-control";
import { KanbanBoard, type BoardCard } from "@/components/kanban-board";
import type { BoardColumnPages } from "@/lib/board-card-view";
import { LogoutButton } from "@/components/logout-button";
import { OwnerLogoutButton } from "@/components/owner-logout-button";
import { ParticipantsPanel } from "@/components/participants-panel";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import { BoardAvatar } from "@/components/board-avatar";

type BoardWorkspaceParticipant = {
  id: string;
  displayName: string;
  avatarKey: string | null;
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
    avatarKey: string | null;
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
      <BoardInboxControlProvider>
        <section className="board-page">
          <header className="board-top">
            <h1 className="board-top-title">{board.title}</h1>
            <BoardSearchField />
            <BoardMarkAllHeaderButton />
            <div className="board-top-actions">
              <p className="board-identity">
                <BoardAvatar
                  name={currentUser.displayName}
                  mark={currentUser.avatarKey}
                  size="md"
                />
                <span>
                  <span className="visually-hidden">{t.board.youAre} </span>
                  <strong>{currentUser.displayName}</strong>
                </span>
              </p>
              <ParticipantsPanel
                participants={board.participants}
                locale={locale}
                slug={board.slug}
                joinToken={board.joinToken}
              />
              {isOwner ? <OwnerLogoutButton iconOnly /> : <LogoutButton iconOnly />}
            </div>
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
      </BoardInboxControlProvider>
    </BoardSearchProvider>
  );
}
