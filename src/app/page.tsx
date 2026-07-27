import { CreateBoardForm } from "@/components/create-board-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";

export default async function HomePage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <section className="hero">
      <div className="hero-grid">
        <div className="hero-copy animate-rise">
          <p className="eyebrow">{t.home.eyebrow}</p>
          <h1>OpenDesk</h1>
          <p className="lede">{t.home.lede}</p>
        </div>
        <CreateBoardForm />
      </div>
    </section>
  );
}
