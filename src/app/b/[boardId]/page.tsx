import { redirect } from "next/navigation";
import { BoardColumn } from "@/components/board-column";
import { CreateCardForm } from "@/components/create-card-form";
import { CARD_COLUMNS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type BoardPageProps = {
  params: Promise<{ boardId: string }>;
};

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params;
  const session = await getSession();

  if (!session || session.boardId !== boardId) {
    redirect("/");
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      cards: {
        include: { author: true },
        orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!board) {
    redirect("/");
  }

  return (
    <section>
      <div className="board-top animate-rise">
        <div>
          <p className="eyebrow">Доска</p>
          <h1>{board.title}</h1>
          <p className="muted">Вы вошли как {session.displayName}</p>
        </div>
        <CreateCardForm boardId={board.id} />
      </div>
      <div className="board-grid">
        {CARD_COLUMNS.map((column) => (
          <BoardColumn
            key={column.status}
            boardId={board.id}
            label={column.label}
            cards={board.cards.filter((card) => card.status === column.status)}
          />
        ))}
      </div>
    </section>
  );
}
