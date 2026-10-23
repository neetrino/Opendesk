import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";
import { CheckEmailForm } from "@/components/check-email-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { getAccount } from "@/lib/account-session";
import { getPendingEmail } from "@/lib/pending-email";

type CheckEmailPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export default async function CheckEmailPage({
  searchParams,
}: CheckEmailPageProps) {
  const account = await getAccount();
  if (account) {
    redirect("/boards");
  }

  const t = getDictionary(await getLocale());
  const { notice } = await searchParams;
  const email = await getPendingEmail();

  return (
    <AuthScreen
      eyebrow={t.checkEmailPage.eyebrow}
      title={t.checkEmailPage.title}
      lede={notice === "delayed" ? t.checkEmailPage.delayed : t.checkEmailPage.lede}
    >
      <CheckEmailForm email={email} />
    </AuthScreen>
  );
}
