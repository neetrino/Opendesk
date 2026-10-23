import Link from "next/link";
import { AuthScreen } from "@/components/auth-screen";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";

export default async function PasswordUpdatedPage() {
  const t = getDictionary(await getLocale());

  return (
    <AuthScreen
      eyebrow={t.passwordUpdatedPage.eyebrow}
      title={t.passwordUpdatedPage.title}
      lede={t.passwordUpdatedPage.lede}
    >
      <Link className="button" href="/boards">
        {t.passwordUpdatedPage.cta}
      </Link>
    </AuthScreen>
  );
}
