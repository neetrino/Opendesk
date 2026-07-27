import Link from "next/link";
import type { Card, CardType, Participant } from "@prisma/client";
import { CARD_TYPE_LABELS } from "@/lib/constants";
import { MoveCardControls } from "@/components/move-card-controls";

type CardWithAuthor = Card & { author: Participant };

type BoardColumnProps = {
  boardId: string;
  label: string;
  cards: CardWithAuthor[];
};

function typeClass(type: CardType): string {
  return type === "question" ? "card-tile question" : "card-tile task";
}

export function BoardColumn({ boardId, label, cards }: BoardColumnProps) {
  return (
    <section className="board-column">
      <header className="column-header">
        <h2>{label}</h2>
        <span className="count">{cards.length}</span>
      </header>
      <div className="column-stack">
        {cards.map((card) => (
          <article key={card.id} className={typeClass(card.type)}>
            <div className="card-meta">
              <span className="type-badge">
                {CARD_TYPE_LABELS[card.type]}
              </span>
              <span className="author">{card.author.displayName}</span>
            </div>
            <Link href={`/b/${boardId}/c/${card.id}`} className="card-title">
              {card.title}
            </Link>
            {card.description ? (
              <p className="card-excerpt">{card.description}</p>
            ) : null}
            <MoveCardControls
              boardId={boardId}
              cardId={card.id}
              currentStatus={card.status}
            />
          </article>
        ))}
        {cards.length === 0 ? (
          <p className="empty-column">Пока пусто</p>
        ) : null}
      </div>
    </section>
  );
}
