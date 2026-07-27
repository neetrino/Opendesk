import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CommentForm } from "@/components/comment-form";
import { MoveCardControls } from "@/components/move-card-controls";
import { CARD_TYPE_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type CardPageProps = {
  params: Promise<{ boardId: string; cardId: string }>;
};

export default async function CardPage({ params }: CardPageProps) {
  const { boardId, cardId } = await params;
  const session = await getSession();

  if (!session || session.boardId !== boardId) {
    redirect("/");
  }

  const card = await prisma.card.findFirst({
    where: { id: cardId, boardId },
    include: {
      author: true,
      comments: {
        include: { author: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!card) {
    notFound();
  }

  return (
    <section>
      <Link href={`/b/${boardId}`} className="back-link">
        ← К доске
      </Link>
      <div className="detail-layout">
        <article className={`detail-panel card-tile ${card.type} animate-rise`}>
          <div className="card-meta">
            <span className="type-badge">{CARD_TYPE_LABELS[card.type]}</span>
            <span className="author">{card.author.displayName}</span>
          </div>
          <h1 style={{ fontSize: "2rem", margin: "0.4rem 0 0.75rem" }}>
            {card.title}
          </h1>
          <p className="detail-body">
            {card.description || "Описание пока не добавлено."}
          </p>
          <div style={{ marginTop: "1.25rem" }}>
            <p className="eyebrow">Стадия</p>
            <MoveCardControls
              boardId={boardId}
              cardId={card.id}
              currentStatus={card.status}
            />
          </div>
        </article>

        <aside className="detail-panel animate-rise">
          <h2>Обсуждение</h2>
          <div className="thread">
            {card.comments.length === 0 ? (
              <p className="muted">Пока нет ответов. Напишите первый.</p>
            ) : (
              card.comments.map((comment) => (
                <div key={comment.id} className="thread-item">
                  <header>
                    <strong>{comment.author.displayName}</strong>
                    <span className="muted">
                      {comment.createdAt.toLocaleString("ru-RU")}
                    </span>
                  </header>
                  <p>{comment.body}</p>
                </div>
              ))
            )}
          </div>
          <CommentForm boardId={boardId} cardId={card.id} />
        </aside>
      </div>
    </section>
  );
}
