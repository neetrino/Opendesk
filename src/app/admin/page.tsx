import Link from "next/link";
import { redirect } from "next/navigation";
import {
  setBoardDisabledAction,
  setUserDisabledAction,
  setUserRoleAction,
} from "@/lib/admin-actions";
import { getAccount } from "@/lib/account-session";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { hasPermission } from "@/lib/platform-permissions";
import { prisma } from "@/lib/prisma";

type AdminPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const account = await getAccount();
  if (!account || !hasPermission(account.role, "admin.users.read")) {
    redirect("/boards");
  }

  const { notice } = await searchParams;
  const locale = await getLocale();
  const t = getDictionary(locale);
  const dateLocale =
    locale === "ru" ? "ru-RU" : locale === "hy" ? "hy-AM" : "en-US";

  const [users, boards, audit] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        disabledAt: true,
        createdAt: true,
        _count: { select: { ownedBoards: true, participants: true } },
      },
    }),
    prisma.board.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        disabledAt: true,
        createdAt: true,
        owner: { select: { email: true, displayName: true } },
        _count: { select: { participants: true } },
      },
    }),
    prisma.adminAudit.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        createdAt: true,
        actor: { select: { email: true } },
      },
    }),
  ]);

  const noticeText =
    notice === "lastAdmin"
      ? t.errors.lastAdmin
      : notice === "roleDenied"
        ? t.errors.roleChangeDenied
        : notice === "invalid"
          ? t.errors.validation
          : null;

  return (
    <section className="boards-page admin-page">
      <div className="boards-page-top">
        <div className="boards-page-heading">
          <h1>{t.adminPage.title}</h1>
          <p className="boards-page-role">{t.adminPage.eyebrow}</p>
        </div>
        <p className="lede boards-page-lede">
          <Link href="/boards">{t.adminPage.back}</Link>
        </p>
      </div>
      {noticeText ? <p className="form-error">{noticeText}</p> : null}

      <h2 className="boards-list-group-title">{t.adminPage.users}</h2>
      {users.length === 0 ? (
        <p className="muted">{t.adminPage.emptyUsers}</p>
      ) : (
        <ul className="admin-list">
          {users.map((user) => (
            <li key={user.id} className="admin-row">
              <div>
                <strong>{user.displayName}</strong>
                <p className="muted">{user.email}</p>
                <p className="muted">
                  {user.role === "platform_admin"
                    ? t.adminPage.roleAdmin
                    : t.adminPage.roleMember}
                  {" · "}
                  {user.disabledAt ? t.adminPage.disabled : t.adminPage.active}
                  {" · "}
                  {t.adminPage.boardsCount
                    .replace("{owned}", String(user._count.ownedBoards))
                    .replace("{joined}", String(user._count.participants))}
                </p>
              </div>
              <div className="admin-row-actions">
                <form action={setUserDisabledAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <input
                    type="hidden"
                    name="disabled"
                    value={user.disabledAt ? "false" : "true"}
                  />
                  <button className="button" type="submit">
                    {user.disabledAt ? t.adminPage.enable : t.adminPage.disable}
                  </button>
                </form>
                <form action={setUserRoleAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <input
                    type="hidden"
                    name="role"
                    value={user.role === "platform_admin" ? "member" : "platform_admin"}
                  />
                  <button className="button" type="submit">
                    {user.role === "platform_admin"
                      ? t.adminPage.removeAdmin
                      : t.adminPage.makeAdmin}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="boards-list-group-title">{t.adminPage.boards}</h2>
      {boards.length === 0 ? (
        <p className="muted">{t.adminPage.emptyBoards}</p>
      ) : (
        <ul className="admin-list">
          {boards.map((board) => (
            <li key={board.id} className="admin-row">
              <div>
                <strong>{board.title}</strong>
                <p className="muted">
                  {board.owner
                    ? `${board.owner.displayName} · ${board.owner.email}`
                    : t.adminPage.noOwner}
                  {" · "}
                  {board.disabledAt ? t.adminPage.disabled : t.adminPage.active}
                  {" · "}
                  {board.createdAt.toLocaleString(dateLocale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <form action={setBoardDisabledAction}>
                <input type="hidden" name="boardId" value={board.id} />
                <input
                  type="hidden"
                  name="disabled"
                  value={board.disabledAt ? "false" : "true"}
                />
                <button className="button" type="submit">
                  {board.disabledAt ? t.adminPage.enable : t.adminPage.disable}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <h2 className="boards-list-group-title">{t.adminPage.audit}</h2>
      {audit.length === 0 ? (
        <p className="muted">{t.adminPage.emptyAudit}</p>
      ) : (
        <ul className="admin-list">
          {audit.map((event) => (
            <li key={event.id} className="admin-row">
              <p>
                {event.action} · {event.targetType} · {event.actor.email}
              </p>
              <p className="muted">
                {event.createdAt.toLocaleString(dateLocale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
