import { redirect } from "next/navigation";
import { BoardListItem } from "@/components/board-list-item";
import { CreateBoardForm } from "@/components/create-board-form";
import { OwnerLogoutButton } from "@/components/owner-logout-button";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { getOwnerSession } from "@/lib/owner-session";
import { prisma } from "@/lib/prisma";

export default async function BoardsPage() {
  const owner = await getOwnerSession();
  if (!owner) {
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
        <div>
          <p className="eyebrow">{t.boardsPage.eyebrow}</p>
          <h1>{t.boardsPage.title}</h1>
          <p className="lede">{t.boardsPage.lede}</p>
        </div>
        <OwnerLogoutButton />
      </div>

      <div className="boards-page-grid">
        <div className="boards-list-panel animate-rise">
          {boards.length === 0 ? (
            <p className="muted">{t.boardsPage.empty}</p>
          ) : (
            <ul className="boards-list">
              {boards.map((board) => (
                <BoardListItem
                  key={board.id}
                  title={board.title}
                  slug={board.slug}
                  joinToken={board.joinToken}
                  createdAtLabel={board.createdAt.toLocaleString(dateLocale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                />
              ))}
            </ul>
          )}
        </div>
        <CreateBoardForm />
      </div>
    </section>
  );
}
