import { AdminConfirmForm } from "@/components/admin-confirm-form";
import { AdminSearchList } from "@/components/admin-search-list";
import {
  setUserDisabledAction,
  setUserRoleAction,
} from "@/lib/admin-actions";
import { adminNamed, adminNoticeText, formatAdminWhen } from "@/lib/admin-view";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { prisma } from "@/lib/prisma";

type AdminUsersPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const { notice } = await searchParams;
  const locale = await getLocale();
  const t = getDictionary(locale);
  const noticeText = adminNoticeText(t.errors, notice);
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      disabledAt: true,
      emailVerifiedAt: true,
      createdAt: true,
      _count: { select: { ownedBoards: true, participants: true } },
    },
  });

  return (
    <section className="admin-section">
      <header className="admin-section-head">
        <h1>{t.adminPage.users}</h1>
      </header>
      {noticeText ? <p className="form-error">{noticeText}</p> : null}
      {users.length === 0 ? (
        <p className="muted">{t.adminPage.emptyUsers}</p>
      ) : (
        <AdminSearchList
          label={t.adminPage.searchLabel}
          placeholder={t.adminPage.searchPeople}
          empty={t.adminPage.searchEmpty}
        >
          {users.map((user) => {
            const roleLabel =
              user.role === "platform_admin"
                ? t.adminPage.roleAdmin
                : t.adminPage.roleMember;
            const statusLabel = user.disabledAt
              ? t.adminPage.disabled
              : t.adminPage.active;
            const verifiedLabel = user.emailVerifiedAt
              ? t.adminPage.verified
              : t.adminPage.unverified;
            const disabling = !user.disabledAt;
            const granting = user.role !== "platform_admin";
            return (
              <li
                key={user.id}
                className="admin-row"
                data-search={`${user.displayName} ${user.email} ${roleLabel} ${statusLabel}`}
              >
                <div>
                  <strong>{user.displayName}</strong>
                  <p className="muted">{user.email}</p>
                  <p className="muted">
                    {roleLabel}
                    {" · "}
                    {statusLabel}
                    {" · "}
                    {verifiedLabel}
                    {" · "}
                    {t.adminPage.created}{" "}
                    {formatAdminWhen(user.createdAt, locale)}
                    {" · "}
                    {t.adminPage.boardsCount
                      .replace("{owned}", String(user._count.ownedBoards))
                      .replace("{joined}", String(user._count.participants))}
                  </p>
                </div>
                <div className="admin-row-actions">
                  <AdminConfirmForm
                    action={setUserDisabledAction}
                    fields={{
                      userId: user.id,
                      disabled: disabling ? "true" : "false",
                    }}
                    label={disabling ? t.adminPage.disable : t.adminPage.enable}
                    title={adminNamed(
                      disabling
                        ? t.adminPage.confirmDisableUser
                        : t.adminPage.confirmEnableUser,
                      user.displayName,
                    )}
                    description={
                      disabling
                        ? t.adminPage.confirmDisableUserHint
                        : t.adminPage.confirmEnableUserHint
                    }
                    confirmLabel={
                      disabling ? t.adminPage.disable : t.adminPage.enable
                    }
                    cancelLabel={t.adminPage.confirmCancel}
                  />
                  <AdminConfirmForm
                    action={setUserRoleAction}
                    fields={{
                      userId: user.id,
                      role: granting ? "platform_admin" : "member",
                    }}
                    label={
                      granting ? t.adminPage.makeAdmin : t.adminPage.removeAdmin
                    }
                    title={adminNamed(
                      granting
                        ? t.adminPage.confirmMakeAdmin
                        : t.adminPage.confirmRemoveAdmin,
                      user.displayName,
                    )}
                    description={
                      granting
                        ? t.adminPage.confirmMakeAdminHint
                        : t.adminPage.confirmRemoveAdminHint
                    }
                    confirmLabel={
                      granting ? t.adminPage.makeAdmin : t.adminPage.removeAdmin
                    }
                    cancelLabel={t.adminPage.confirmCancel}
                  />
                </div>
              </li>
            );
          })}
        </AdminSearchList>
      )}
    </section>
  );
}
