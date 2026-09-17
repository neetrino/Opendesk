import { notFound, redirect } from "next/navigation";
import { BoardWorkspace } from "@/components/board-workspace";
import { JoinBoardForm } from "@/components/join-board-form";
import { RememberBoardVisit } from "@/components/remember-board-visit";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import {
  ensureBoardAvatars,
  loadBoardParticipantIdentities,
} from "@/lib/assign-board-avatars";
import { ensureOwnerParticipant } from "@/lib/board-access";
import { getParticipantBoardDestination } from "@/lib/board-navigation";
import { loadBoardCardPages } from "@/lib/board-cards";
import { loadBoardLabels } from "@/lib/board-labels";
import { OWNER_PARTICIPANT_NAME } from "@/lib/constants";
import { buildJoinPath } from "@/lib/join-url";
import { getOwnerSession } from "@/lib/owner-session";
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
 * With access → workspace; without → join form.
 */
export default async function BoardBySlugPage({ params }: BoardBySlugPageProps) {
  const { boardId: boardSlug, joinToken } = await params;
  const requestedPath = buildJoinPath(boardSlug, joinToken);
  const owner = await getOwnerSession();
  const participantBoard = owner
    ? null
    : await getParticipantBoardDestination();

  if (participantBoard && participantBoard.path !== requestedPath) {
    redirect(participantBoard.path);
  }

  if (!owner && !participantBoard) {
    const [locale, boardMeta] = await Promise.all([
      getLocale(),
      prisma.board.findUnique({
        where: { joinToken },
        select: { title: true, slug: true, joinToken: true },
      }),
    ]);

    if (!boardMeta) {
      notFound();
    }

    if (boardMeta.slug !== boardSlug) {
      redirect(buildJoinPath(boardMeta.slug, boardMeta.joinToken));
    }

    const t = getDictionary(locale);
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

  const [locale, board] = await Promise.all([
    getLocale(),
    prisma.board.findUnique({
      where: owner ? { joinToken } : { id: participantBoard!.boardId },
      include: {
        participants: {
          where: visibleParticipantFilter(participantBoard?.participantId),
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            displayName: true,
            avatarKey: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);

  if (!board) {
    notFound();
  }

  if (board.participants.some((person) => !person.avatarKey)) {
    await ensureBoardAvatars(board.id);
    board.participants = await loadBoardParticipantIdentities(
      board.id,
      participantBoard?.participantId,
    );
  }

  const [cardPages, boardLabels] = await Promise.all([
    loadBoardCardPages(board.id),
    loadBoardLabels(board.id),
  ]);

  const canonicalPath = buildJoinPath(board.slug, board.joinToken);
  if (canonicalPath !== requestedPath) {
    redirect(canonicalPath);
  }

  const t = getDictionary(locale);

  let currentUser: {
    participantId: string;
    displayName: string;
    avatarKey: string | null;
  };
  if (owner) {
    let participant = board.participants.find(
      (item) =>
        item.displayName.toLocaleLowerCase() ===
        OWNER_PARTICIPANT_NAME.toLocaleLowerCase(),
    );
    if (!participant) {
      const created = await ensureOwnerParticipant(board.id);
      board.participants = await loadBoardParticipantIdentities(
        board.id,
        created.id,
      );
      participant =
        board.participants.find((item) => item.id === created.id) ?? {
          ...created,
          createdAt: new Date(),
        };
    }
    await touchParticipantLastSeen(prisma, participant.id);
    currentUser = {
      participantId: participant.id,
      displayName: participant.displayName,
      avatarKey: participant.avatarKey,
    };
  } else {
    if (!participantBoard || participantBoard.boardId !== board.id) {
      redirect(buildJoinPath(board.slug, board.joinToken));
    }
    currentUser = {
      participantId: participantBoard.participantId,
      displayName: participantBoard.displayName,
      avatarKey:
        board.participants.find(
          (item) => item.id === participantBoard.participantId,
        )?.avatarKey ?? null,
    };
  }

  return (
    <>
      {owner ? <RememberBoardVisit path={canonicalPath} /> : null}
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
        isOwner={Boolean(owner)}
        attachmentsEnabled={isR2Configured()}
      />
    </>
  );
}
