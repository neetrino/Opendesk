import { InviteButton } from "@/components/invite-button";
import { KanbanBoard, type BoardCard } from "@/components/kanban-board";
import { LogoutButton } from "@/components/logout-button";
import { OwnerLogoutButton } from "@/components/owner-logout-button";
import { ParticipantsPanel } from "@/components/participants-panel";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";

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
    <section className="board-page">
      <div className="board-top">
        <div className="board-top-main">
          <h1>{board.title}</h1>
          <p className="muted">
            {t.board.youAre} {currentUser.displayName}
          </p>
          <p className="muted board-join-hint">{t.board.inviteHint}</p>
        </div>
        <div className="board-top-actions">
          <ParticipantsPanel
            participants={board.participants}
            locale={locale}
          />
          <InviteButton slug={board.slug} joinToken={board.joinToken} compact />
        </div>
        {isOwner ? <OwnerLogoutButton /> : <LogoutButton />}
      </div>
      <KanbanBoard
        boardId={board.id}
        cards={board.cards}
        locale={locale}
        currentUser={currentUser}
        attachmentsEnabled={attachmentsEnabled}
      />
    </section>
  );
}
