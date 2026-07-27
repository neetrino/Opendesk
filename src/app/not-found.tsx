import Link from "next/link";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";

export default async function NotFoundPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <section className="hero">
      <div className="invite-panel animate-rise">
        <p className="eyebrow">404</p>
        <h1>{t.notFound.title}</h1>
        <p className="muted">{t.notFound.body}</p>
        <Link className="button" href="/" style={{ marginTop: "1rem" }}>
          {t.notFound.home}
        </Link>
      </div>
    </section>
  );
}
