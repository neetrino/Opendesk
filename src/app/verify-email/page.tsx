import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";
import { ConfirmEmailForm } from "@/components/confirm-email-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { getAccount } from "@/lib/account-session";
import { peekEmailToken } from "@/lib/account-mail";
import { isEmailTokenShape } from "@/lib/email-token";

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const account = await getAccount();
  if (account) {
    redirect("/boards");
  }

  const t = getDictionary(await getLocale());
  const { token } = await searchParams;
  const ready =
    typeof token === "string" &&
    isEmailTokenShape(token) &&
    (await peekEmailToken(token, "verify_email")) === "ready";

  if (!ready) {
    return (
      <AuthScreen
        eyebrow={t.confirmEmailPage.eyebrow}
        title={t.confirmEmailPage.invalidTitle}
        lede={t.confirmEmailPage.invalid}
      >
        <Link className="button" href="/check-email">
          {t.confirmEmailPage.back}
        </Link>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      eyebrow={t.confirmEmailPage.eyebrow}
      title={t.confirmEmailPage.title}
      lede={t.confirmEmailPage.lede}
    >
      <ConfirmEmailForm token={token} />
    </AuthScreen>
  );
}
