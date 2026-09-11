import Link from "next/link";
import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import {
  getParticipantBoardDestination,
  getRememberedOwnerBoardPath,
} from "@/lib/board-navigation";
import { getOwnerSession } from "@/lib/owner-session";

export default async function HomePage() {
  const owner = await getOwnerSession();
  if (owner) {
    redirect((await getRememberedOwnerBoardPath()) ?? "/boards");
  }

  const participantBoard = await getParticipantBoardDestination();
  if (participantBoard) {
    redirect(participantBoard.path);
  }

  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <section className="hero">
      <div className="hero-grid">
        <div className="hero-copy animate-rise">
          <p className="eyebrow">{t.home.eyebrow}</p>
          <h1>OpenDesk</h1>
          <p className="lede">{t.home.lede}</p>
          <div className="hero-cta-row">
            <Link className="button" href="/login">
              {t.home.loginCta}
            </Link>
          </div>
        </div>
        <div className="hero-preview" aria-hidden="true">
          {(["new", "in_progress", "answered", "done"] as const).map((status) => (
            <div key={status} className={`hero-lane column-${status}`}>
              <div className="hero-lane-head">
                <span />
                <span />
              </div>
              <div className="hero-card" />
              <div className={status === "new" ? "hero-card is-urgent" : "hero-card"} />
              <div className="hero-card" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
