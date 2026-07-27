import { notFound, redirect } from "next/navigation";
import { JoinBoardForm } from "@/components/join-board-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { buildJoinPath } from "@/lib/join-url";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type JoinBySlugPageProps = {
  params: Promise<{ boardId: string; joinToken: string }>;
};

/**
 * Join entry: `/b/{slug}/{joinToken}`.
 * The first segment is the board slug (folder param name remains `boardId`).
 */
export default async function JoinBySlugPage({ params }: JoinBySlugPageProps) {
  const { boardId: boardSlug, joinToken } = await params;
  const locale = await getLocale();
  const t = getDictionary(locale);
  const board = await prisma.board.findUnique({
    where: { joinToken },
    select: { id: true, title: true, slug: true },
  });

  if (!board) {
    notFound();
  }

  if (board.slug !== boardSlug) {
    redirect(buildJoinPath(board.slug, joinToken));
  }

  const session = await getSession();
  if (session?.boardId === board.id) {
    redirect(`/b/${board.id}`);
  }

  return (
    <section className="hero">
      <div className="hero-grid">
        <div className="hero-copy animate-rise">
          <p className="eyebrow">{t.joinPage.eyebrow}</p>
          <h1>{board.title}</h1>
          <p className="lede">{t.joinPage.joinLede}</p>
        </div>
        <JoinBoardForm token={joinToken} />
      </div>
    </section>
  );
}
