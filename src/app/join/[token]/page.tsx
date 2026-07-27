import { notFound, redirect } from "next/navigation";
import { JoinBoardForm } from "@/components/join-board-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type JoinPageProps = {
  params: Promise<{ token: string }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { token } = await params;
  const locale = await getLocale();
  const t = getDictionary(locale);
  const board = await prisma.board.findUnique({
    where: { joinToken: token },
    select: { id: true, title: true },
  });

  if (!board) {
    notFound();
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
        <JoinBoardForm token={token} />
      </div>
    </section>
  );
}
