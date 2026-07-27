import { CreateBoardForm } from "@/components/create-board-form";

export default function HomePage() {
  return (
    <section className="hero">
      <div className="hero-grid">
        <div className="hero-copy animate-rise">
          <p className="eyebrow">Без регистрации</p>
          <h1>OpenDesk</h1>
          <p className="lede">
            Одна общая доска для вопросов и задач. Приглашаете по уникальной
            ссылке — человек пишет имя и сразу в работе.
          </p>
        </div>
        <CreateBoardForm />
      </div>
    </section>
  );
}
