import { redirect } from "next/navigation";
import { AccountPasswordForm } from "@/components/account-password-form";
import { AccountProfileForm } from "@/components/account-profile-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { getAccount } from "@/lib/account-session";

export default async function AccountPage() {
  const account = await getAccount();
  if (!account) {
    redirect("/login");
  }

  const t = getDictionary(await getLocale());

  return (
    <section className="account-page">
      <header className="admin-section-head">
        <p className="eyebrow">{t.accountPage.eyebrow}</p>
        <h1>{t.accountPage.title}</h1>
        <p className="lede">{t.accountPage.lede}</p>
      </header>
      <div className="account-forms">
        <AccountProfileForm
          displayName={account.displayName}
          email={account.email}
        />
        <AccountPasswordForm />
      </div>
    </section>
  );
}
