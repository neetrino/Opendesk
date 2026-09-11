import { notFound, redirect } from "next/navigation";
import { BoardWorkspace } from "@/components/board-workspace";
import { JoinBoardForm } from "@/components/join-board-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import {
  ensureOwnerParticipant,
} from "@/lib/board-access";
import { getParticipantBoardDestination } from "@/lib/board-navigation";
import { buildJoinPath } from "@/lib/join-url";
import { getOwnerSession } from "@/lib/owner-session";
import { ATTACHMENT_PUBLIC_SELECT } from "@/lib/attachments";
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
  const locale = await getLocale();
  const t = getDictionary(locale);

  const boardMeta = await prisma.board.findUnique({
    where: { joinToken },
    select: { id: true, title: true, slug: true, joinToken: true },
  });

  if (!boardMeta) {
    notFound();
  }

  if (boardMeta.slug !== boardSlug) {
    redirect(buildJoinPath(boardMeta.slug, joinToken));
  }

  const owner = await getOwnerSession();
  const participantBoard = owner
    ? null
    : await getParticipantBoardDestination();

  if (participantBoard && participantBoard.boardId !== boardMeta.id) {
    redirect(participantBoard.path);
  }

  if (!owner && !participantBoard) {
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

  const board = await prisma.board.findUnique({
    where: { id: boardMeta.id },
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
          attachments: {
            where: { commentId: null },
            orderBy: { createdAt: "asc" },
            select: ATTACHMENT_PUBLIC_SELECT,
          },
          comments: {
            include: {
              author: true,
              attachments: {
                orderBy: { createdAt: "asc" },
                select: ATTACHMENT_PUBLIC_SELECT,
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!board) {
    notFound();
  }

  let currentUser: { participantId: string; displayName: string };
  if (owner) {
    const participant = await ensureOwnerParticipant(board.id);
    currentUser = {
      participantId: participant.id,
      displayName: participant.displayName,
    };
  } else {
    if (!participantBoard || participantBoard.boardId !== board.id) {
      redirect(buildJoinPath(board.slug, board.joinToken));
    }
    currentUser = {
      participantId: participantBoard.participantId,
      displayName: participantBoard.displayName,
    };
  }

  return (
    <BoardWorkspace
      board={board}
      locale={locale}
      t={t}
      currentUser={currentUser}
      isOwner={Boolean(owner)}
      attachmentsEnabled={isR2Configured()}
    />
  );
}
