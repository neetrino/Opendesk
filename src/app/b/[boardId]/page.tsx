import { redirect } from "next/navigation";
import { InviteButton } from "@/components/invite-button";
import { KanbanBoard } from "@/components/kanban-board";
import { LogoutButton } from "@/components/logout-button";
import { ParticipantsPanel } from "@/components/participants-panel";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { MAX_BOARD_PARTICIPANTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type BoardPageProps = {
  params: Promise<{ boardId: string }>;
};

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params;
  const session = await getSession();
  const locale = await getLocale();
  const t = getDictionary(locale);

  if (!session || session.boardId !== boardId) {
    redirect("/");
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      participants: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          displayName: true,
          createdAt: true,
        },
      },
      cards: {
        include: {
          author: true,
          comments: {
            include: { author: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!board) {
    redirect("/");
  }

  const boardFull = board.participants.length >= MAX_BOARD_PARTICIPANTS;

  return (
    <section className="board-page">
      <div className="board-top">
        <div className="board-top-main">
          <h1>{board.title}</h1>
          <p className="muted">
            {t.board.youAre} {session.displayName}
          </p>
        </div>
        <div className="board-top-actions">
          <ParticipantsPanel
            participants={board.participants}
            locale={locale}
          />
          <InviteButton boardId={board.id} compact disabled={boardFull} />
        </div>
        <LogoutButton />
      </div>
      <KanbanBoard
        boardId={board.id}
        cards={board.cards}
        locale={locale}
        currentUser={{
          participantId: session.participantId,
          displayName: session.displayName,
        }}
      />
    </section>
  );
}
