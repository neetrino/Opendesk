import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/register-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { getAccount } from "@/lib/account-session";

export default async function RegisterPage() {
  const account = await getAccount();
  if (account) {
    redirect("/boards");
  }

  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <section className="hero">
      <div className="hero-grid">
        <div className="hero-copy animate-rise">
          <p className="eyebrow">{t.registerPage.eyebrow}</p>
          <h1>{t.registerPage.title}</h1>
          <p className="lede">{t.registerPage.lede}</p>
          <p className="muted">
            <Link href="/">{t.notFound.home}</Link>
          </p>
        </div>
        <RegisterForm />
      </div>
    </section>
  );
}
