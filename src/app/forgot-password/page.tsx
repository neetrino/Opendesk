import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { getAccount } from "@/lib/account-session";

export default async function ForgotPasswordPage() {
  const account = await getAccount();
  if (account) {
    redirect("/boards");
  }

  const t = getDictionary(await getLocale());

  return (
    <AuthScreen
      eyebrow={t.forgotPage.eyebrow}
      title={t.forgotPage.title}
      lede={t.forgotPage.lede}
    >
      <ForgotPasswordForm />
    </AuthScreen>
  );
}
