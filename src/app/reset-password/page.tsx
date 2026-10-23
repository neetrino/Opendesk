import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { getAccount } from "@/lib/account-session";
import { peekEmailToken } from "@/lib/account-mail";
import { isEmailTokenShape } from "@/lib/email-token";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const account = await getAccount();
  if (account) {
    redirect("/boards");
  }

  const t = getDictionary(await getLocale());
  const { token } = await searchParams;
  const ready =
    typeof token === "string" &&
    isEmailTokenShape(token) &&
    (await peekEmailToken(token, "reset_password")) === "ready";

  if (!ready) {
    return (
      <AuthScreen
        eyebrow={t.resetPage.eyebrow}
        title={t.resetPage.invalidTitle}
        lede={t.resetPage.invalid}
      >
        <Link className="button" href="/forgot-password">
          {t.resetPage.back}
        </Link>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      eyebrow={t.resetPage.eyebrow}
      title={t.resetPage.title}
      lede={t.resetPage.lede}
    >
      <ResetPasswordForm token={token} />
    </AuthScreen>
  );
}
