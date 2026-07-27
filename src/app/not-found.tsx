import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="hero">
      <div className="invite-panel animate-rise">
        <p className="eyebrow">404</p>
        <h1>Страница не найдена</h1>
        <p className="muted">
          Ссылка устарела или доска / приглашение не существует.
        </p>
        <Link className="button" href="/" style={{ marginTop: "1rem" }}>
          На главную
        </Link>
      </div>
    </section>
  );
}
