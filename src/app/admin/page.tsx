import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import {
  auditActionLabel,
  countCreatedInLastWeek,
  formatAdminWhen,
} from "@/lib/admin-view";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  const [
    accounts,
    active,
    disabled,
    admins,
    unconfirmed,
    boards,
    closedBoards,
    seats,
    createdThisWeek,
    recentUsers,
    recentAudit,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { disabledAt: null } }),
    prisma.user.count({ where: { disabledAt: { not: null } } }),
    prisma.user.count({
      where: { role: "platform_admin", disabledAt: null },
    }),
    prisma.user.count({
      where: { emailVerifiedAt: null, disabledAt: null },
    }),
    prisma.board.count(),
    prisma.board.count({ where: { disabledAt: { not: null } } }),
    prisma.participant.count(),
    countCreatedInLastWeek(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        displayName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.adminAudit.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        action: true,
        createdAt: true,
        actor: { select: { email: true } },
      },
    }),
  ]);

  const stats = [
    [t.adminPage.statAccounts, accounts],
    [t.adminPage.statActive, active],
    [t.adminPage.statDisabled, disabled],
    [t.adminPage.statAdmins, admins],
    [t.adminPage.statUnconfirmed, unconfirmed],
    [t.adminPage.statBoards, boards],
    [t.adminPage.statClosedBoards, closedBoards],
    [t.adminPage.statSeats, seats],
    [t.adminPage.statNewAccounts, createdThisWeek.accounts],
    [t.adminPage.statNewBoards, createdThisWeek.boards],
  ] as const;

  return (
    <section className="admin-section">
      <header className="admin-section-head">
        <h1>{t.adminPage.dashboardTitle}</h1>
        <p className="lede">{t.adminPage.dashboardLede}</p>
      </header>
      <ul className="admin-stats">
        {stats.map(([label, value]) => (
          <li key={label} className="admin-stat">
            <strong>{value}</strong>
            <span>{label}</span>
          </li>
        ))}
      </ul>

      <h2 className="boards-list-group-title">{t.adminPage.recentUsers}</h2>
      {recentUsers.length === 0 ? (
        <p className="muted">{t.adminPage.emptyUsers}</p>
      ) : (
        <ul className="admin-list">
          {recentUsers.map((user) => (
            <li key={user.id} className="admin-row">
              <div>
                <strong>{user.displayName}</strong>
                <p className="muted">{user.email}</p>
              </div>
              <p className="muted">
                {user.role === "platform_admin"
                  ? t.adminPage.roleAdmin
                  : t.adminPage.roleMember}
                {" · "}
                {formatAdminWhen(user.createdAt, locale)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <h2 className="boards-list-group-title">{t.adminPage.recentAudit}</h2>
      {recentAudit.length === 0 ? (
        <p className="muted">{t.adminPage.emptyAudit}</p>
      ) : (
        <ul className="admin-list">
          {recentAudit.map((event) => (
            <li key={event.id} className="admin-row">
              <div>
                <strong>{auditActionLabel(t.adminPage, event.action)}</strong>
                <p className="muted">{event.actor.email}</p>
              </div>
              <p className="muted">{formatAdminWhen(event.createdAt, locale)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
