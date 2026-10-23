import Link from "next/link";
import { AuthScreen } from "@/components/auth-screen";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";

export default async function EmailConfirmedPage() {
  const t = getDictionary(await getLocale());

  return (
    <AuthScreen
      eyebrow={t.emailConfirmedPage.eyebrow}
      title={t.emailConfirmedPage.title}
      lede={t.emailConfirmedPage.lede}
    >
      <Link className="button" href="/boards">
        {t.emailConfirmedPage.cta}
      </Link>
    </AuthScreen>
  );
}
