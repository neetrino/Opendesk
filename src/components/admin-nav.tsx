"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/provider";

const ITEMS = [
  { href: "/admin", label: "navDashboard" },
  { href: "/admin/users", label: "navUsers" },
  { href: "/admin/boards", label: "navBoards" },
  { href: "/admin/audit", label: "navAudit" },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside className="admin-nav">
      <p className="eyebrow">{t.adminPage.eyebrow}</p>
      <nav className="admin-nav-links" aria-label={t.adminPage.title}>
        {ITEMS.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "is-active" : undefined}
              aria-current={active ? "page" : undefined}
            >
              {t.adminPage[item.label]}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
