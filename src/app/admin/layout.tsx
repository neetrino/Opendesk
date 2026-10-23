import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { getAccount } from "@/lib/account-session";
import { hasPermission } from "@/lib/platform-permissions";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const account = await getAccount();
  if (!account || !hasPermission(account.role, "admin.users.read")) {
    redirect("/boards");
  }

  return (
    <div className="admin-shell">
      <AdminNav />
      <div className="admin-main">{children}</div>
    </div>
  );
}
