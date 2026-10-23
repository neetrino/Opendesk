import { AdminSearchList } from "@/components/admin-search-list";
import { auditActionLabel, formatAdminWhen } from "@/lib/admin-view";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { prisma } from "@/lib/prisma";

export default async function AdminAuditPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const audit = await prisma.adminAudit.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      action: true,
      targetType: true,
      createdAt: true,
      actor: { select: { email: true, displayName: true } },
    },
  });

  return (
    <section className="admin-section">
      <header className="admin-section-head">
        <h1>{t.adminPage.audit}</h1>
      </header>
      {audit.length === 0 ? (
        <p className="muted">{t.adminPage.emptyAudit}</p>
      ) : (
        <AdminSearchList
          label={t.adminPage.searchLabel}
          placeholder={t.adminPage.searchAudit}
          empty={t.adminPage.searchEmpty}
        >
          {audit.map((event) => {
            const actionLabel = auditActionLabel(t.adminPage, event.action);
            return (
              <li
                key={event.id}
                className="admin-row"
                data-search={`${actionLabel} ${event.actor.displayName} ${event.actor.email}`}
              >
                <div>
                  <strong>{actionLabel}</strong>
                  <p className="muted">
                    {event.actor.displayName} · {event.actor.email}
                  </p>
                </div>
                <p className="muted">{formatAdminWhen(event.createdAt, locale)}</p>
              </li>
            );
          })}
        </AdminSearchList>
      )}
    </section>
  );
}
