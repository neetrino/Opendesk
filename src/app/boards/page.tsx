import { redirect } from "next/navigation";
import { BoardsList } from "@/components/boards-list";
import { OwnerLogoutButton } from "@/components/owner-logout-button";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { getParticipantBoardDestination } from "@/lib/board-navigation";
import { getOwnerSession } from "@/lib/owner-session";
import { prisma } from "@/lib/prisma";

export default async function BoardsPage() {
  const owner = await getOwnerSession();
  if (!owner) {
    const participantBoard = await getParticipantBoardDestination();
    if (participantBoard) {
      redirect(participantBoard.path);
    }
    redirect("/login");
  }

  const locale = await getLocale();
  const t = getDictionary(locale);
  const boards = await prisma.board.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      joinToken: true,
      createdAt: true,
    },
  });

  const dateLocale =
    locale === "ru" ? "ru-RU" : locale === "hy" ? "hy-AM" : "en-US";

  return (
    <section className="boards-page">
      <div className="boards-page-top">
        <div className="boards-page-heading">
          <h1>{t.boardsPage.title}</h1>
          <p className="boards-page-role">{t.boardsPage.eyebrow}</p>
        </div>
        <OwnerLogoutButton />
        <p className="lede boards-page-lede">{t.boardsPage.lede}</p>
      </div>

      <div className="boards-page-grid">
        <BoardsList
          boards={boards.map((board) => ({
            id: board.id,
            title: board.title,
            slug: board.slug,
            joinToken: board.joinToken,
            createdAtLabel: board.createdAt.toLocaleString(dateLocale, {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          }))}
        />
      </div>
    </section>
  );
}
