import { redirect } from "next/navigation";
import { BoardsList } from "@/components/boards-list";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { getParticipantBoardDestination } from "@/lib/board-navigation";
import { getAccount } from "@/lib/account-session";
import { prisma } from "@/lib/prisma";

export default async function BoardsPage() {
  const account = await getAccount();
  if (!account) {
    const participantBoard = await getParticipantBoardDestination();
    if (participantBoard) {
      redirect(participantBoard.path);
    }
    redirect("/login");
  }

  const locale = await getLocale();
  const t = getDictionary(locale);
  const boards = await prisma.board.findMany({
    where: {
      disabledAt: null,
      OR: [
        { ownerId: account.id },
        { participants: { some: { userId: account.id } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      joinToken: true,
      createdAt: true,
      ownerId: true,
    },
  });

  const dateLocale =
    locale === "ru" ? "ru-RU" : locale === "hy" ? "hy-AM" : "en-US";

  const listed = boards.map((board) => ({
    id: board.id,
    title: board.title,
    slug: board.slug,
    joinToken: board.joinToken,
    createdAtLabel: board.createdAt.toLocaleString(dateLocale, {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    owned: board.ownerId === account.id,
  }));

  return (
    <section className="boards-page">
      <div className="boards-page-top">
        <div className="boards-page-heading">
          <h1>{t.boardsPage.title}</h1>
          <p className="boards-page-role">{account.displayName}</p>
        </div>
        <p className="lede boards-page-lede">{t.boardsPage.lede}</p>
      </div>

      <div className="boards-page-grid">
        <BoardsList
          owned={listed.filter((board) => board.owned)}
          invited={listed.filter((board) => !board.owned)}
        />
      </div>
    </section>
  );
}
