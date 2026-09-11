import Link from "next/link";
import { OwnerLoginForm } from "@/components/owner-login-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { getParticipantBoardDestination } from "@/lib/board-navigation";
import { getOwnerSession } from "@/lib/owner-session";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const owner = await getOwnerSession();
  if (owner) {
    redirect("/boards");
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
          <p className="eyebrow">{t.loginPage.eyebrow}</p>
          <h1>{t.loginPage.title}</h1>
          <p className="lede">{t.loginPage.lede}</p>
          <p className="muted">
            <Link href="/">{t.notFound.home}</Link>
          </p>
        </div>
        <OwnerLoginForm />
      </div>
    </section>
  );
}
