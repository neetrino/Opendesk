import Link from "next/link";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { getOwnerSession } from "@/lib/owner-session";

export default async function HomePage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const owner = await getOwnerSession();

  return (
    <section className="hero">
      <div className="hero-grid">
        <div className="hero-copy animate-rise">
          <p className="eyebrow">{t.home.eyebrow}</p>
          <h1>OpenDesk</h1>
          <p className="lede">{t.home.lede}</p>
          <div className="hero-cta-row">
            {owner ? (
              <Link className="button" href="/boards">
                {t.home.boardsCta}
              </Link>
            ) : (
              <Link className="button" href="/login">
                {t.home.loginCta}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
