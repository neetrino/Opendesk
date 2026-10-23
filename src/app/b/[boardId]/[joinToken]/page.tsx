import { notFound, redirect } from "next/navigation";
import { AccountJoinForm } from "@/components/account-join-form";
import { BoardWorkspace } from "@/components/board-workspace";
import { JoinBoardForm } from "@/components/join-board-form";
import { RememberBoardVisit } from "@/components/remember-board-visit";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { getAccount } from "@/lib/account-session";
import {
  ensureBoardAvatars,
  loadBoardParticipantIdentities,
} from "@/lib/assign-board-avatars";
import { resolveAccountSeat } from "@/lib/board-access";
import { getParticipantBoardDestination } from "@/lib/board-navigation";
import { loadBoardCardPages } from "@/lib/board-cards";
import { loadBoardLabels } from "@/lib/board-labels";
import { buildJoinPath } from "@/lib/join-url";
import {
  touchParticipantLastSeen,
  visibleParticipantFilter,
} from "@/lib/participant-activity";
import { prisma } from "@/lib/prisma";
import { isR2Configured } from "@/lib/r2";

type BoardBySlugPageProps = {
  params: Promise<{ boardId: string; joinToken: string }>;
};

/**
 * Canonical board URL: `/b/{slug}/{joinToken}`.
 * Account seat or guest cookie → workspace; otherwise a join form.
 */
export default async function BoardBySlugPage({ params }: BoardBySlugPageProps) {
  const { boardId: boardSlug, joinToken } = await params;
  const requestedPath = buildJoinPath(boardSlug, joinToken);
  const [account, boardMeta] = await Promise.all([
    getAccount(),
    prisma.board.findUnique({
      where: { joinToken },
      select: {
        id: true,
        title: true,
        slug: true,
        joinToken: true,
        ownerId: true,
        disabledAt: true,
      },
    }),
  ]);

  if (!boardMeta) {
    notFound();
  }

  const canonicalPath = buildJoinPath(boardMeta.slug, boardMeta.joinToken);
  if (canonicalPath !== requestedPath) {
    redirect(canonicalPath);
  }

  const locale = await getLocale();
  const t = getDictionary(locale);

  if (boardMeta.disabledAt) {
    return (
      <section className="hero">
        <div className="invite-panel animate-rise">
          <p className="eyebrow">{t.joinPage.eyebrow}</p>
          <h1>{boardMeta.title}</h1>
          <p className="lede">{t.errors.boardClosed}</p>
        </div>
      </section>
    );
  }

  let currentUser: {
    participantId: string;
    displayName: string;
    avatarKey: string | null;
  };
  let isOwner = false;
  let showSaveAccount = false;

  if (account) {
    const seat = await resolveAccountSeat(boardMeta.id, account, boardMeta.ownerId);
    if (!seat) {
      return (
        <section className="hero">
          <div className="hero-grid">
            <div className="hero-copy animate-rise">
              <p className="eyebrow">{t.joinPage.eyebrow}</p>
              <h1>{boardMeta.title}</h1>
              <p className="lede">{t.joinPage.accountJoinLede}</p>
            </div>
            <AccountJoinForm
              token={joinToken}
              defaultName={account.displayName}
            />
          </div>
        </section>
      );
    }
    currentUser = {
      participantId: seat.id,
      displayName: seat.displayName,
      avatarKey: seat.avatarKey,
    };
    isOwner = boardMeta.ownerId === account.id;
  } else {
    const participantBoard = await getParticipantBoardDestination();
    if (participantBoard && participantBoard.path !== requestedPath) {
      redirect(participantBoard.path);
    }
    if (!participantBoard || participantBoard.boardId !== boardMeta.id) {
      return (
        <section className="hero">
          <div className="hero-grid">
            <div className="hero-copy animate-rise">
              <p className="eyebrow">{t.joinPage.eyebrow}</p>
              <h1>{boardMeta.title}</h1>
              <p className="lede">{t.joinPage.joinLede}</p>
            </div>
            <JoinBoardForm token={joinToken} />
          </div>
        </section>
      );
    }
    currentUser = {
      participantId: participantBoard.participantId,
      displayName: participantBoard.displayName,
      avatarKey: null,
    };
    showSaveAccount = true;
  }

  const board = await prisma.board.findUnique({
    where: { id: boardMeta.id },
    include: {
      participants: {
        where: visibleParticipantFilter(currentUser.participantId),
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          displayName: true,
          avatarKey: true,
          createdAt: true,
        },
      },
    },
  });

  if (!board) {
    notFound();
  }

  if (board.participants.some((person) => !person.avatarKey)) {
    await ensureBoardAvatars(board.id);
    board.participants = await loadBoardParticipantIdentities(
      board.id,
      currentUser.participantId,
    );
  }

  currentUser = {
    ...currentUser,
    avatarKey:
      board.participants.find((item) => item.id === currentUser.participantId)
        ?.avatarKey ?? currentUser.avatarKey,
  };

  const [cardPages, boardLabels] = await Promise.all([
    loadBoardCardPages(board.id),
    loadBoardLabels(board.id),
  ]);

  await touchParticipantLastSeen(prisma, currentUser.participantId);

  return (
    <>
      {account ? <RememberBoardVisit path={canonicalPath} /> : null}
      <BoardWorkspace
        board={{
          ...board,
          cards: cardPages.cards,
          columnPages: cardPages.columns,
          labels: boardLabels,
        }}
        locale={locale}
        t={t}
        currentUser={currentUser}
        isOwner={isOwner}
        showSaveAccount={showSaveAccount}
        attachmentsEnabled={isR2Configured()}
      />
    </>
  );
}
