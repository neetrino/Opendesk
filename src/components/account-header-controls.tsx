import { AccountHeaderLinks } from "@/components/account-header-links";
import { OwnerLogoutButton } from "@/components/owner-logout-button";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { getAccount } from "@/lib/account-session";
import { hasPermission } from "@/lib/platform-permissions";

/** Same account controls on every screen: boards, account, admin, logout. */
export async function AccountHeaderControls() {
  const account = await getAccount();
  if (!account) {
    return null;
  }

  const t = getDictionary(await getLocale());

  return (
    <div className="header-actions">
      <AccountHeaderLinks
        boardsLabel={t.boardsPage.nav}
        accountLabel={t.boardsPage.account}
        adminLabel={t.boardsPage.admin}
        showAdmin={hasPermission(account.role, "admin.users.read")}
      />
      <OwnerLogoutButton iconOnly />
    </div>
  );
}
