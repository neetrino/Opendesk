import type { Dictionary } from "@/i18n/dictionary";
import { prisma } from "@/lib/prisma";

/** Accounts and boards created in the last 7 days, counted in the database. */
export async function countCreatedInLastWeek(): Promise<{
  accounts: number;
  boards: number;
}> {
  const rows = await prisma.$queryRaw<Array<{ accounts: number; boards: number }>>`
    SELECT
      (SELECT COUNT(*)::int FROM "User" WHERE "createdAt" >= NOW() - INTERVAL '7 days') AS accounts,
      (SELECT COUNT(*)::int FROM "Board" WHERE "createdAt" >= NOW() - INTERVAL '7 days') AS boards
  `;
  return rows[0] ?? { accounts: 0, boards: 0 };
}

export function adminDateLocale(locale: string): string {
  if (locale === "ru") {
    return "ru-RU";
  }
  if (locale === "hy") {
    return "hy-AM";
  }
  return "en-US";
}

export function adminNamed(template: string, name: string): string {
  return template.replaceAll("{name}", name);
}

export function formatAdminWhen(date: Date, locale: string): string {
  return date.toLocaleString(adminDateLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function adminNoticeText(
  errors: Dictionary["errors"],
  notice?: string,
): string | null {
  if (notice === "lastAdmin") {
    return errors.lastAdmin;
  }
  if (notice === "roleDenied") {
    return errors.roleChangeDenied;
  }
  if (notice === "invalid") {
    return errors.validation;
  }
  return null;
}

export function auditActionLabel(
  copy: Dictionary["adminPage"],
  action: string,
): string {
  switch (action) {
    case "user.disable":
      return copy.auditUserDisable;
    case "user.enable":
      return copy.auditUserEnable;
    case "user.grant_admin":
      return copy.auditGrantAdmin;
    case "user.revoke_admin":
      return copy.auditRevokeAdmin;
    case "board.disable":
      return copy.auditBoardDisable;
    case "board.enable":
      return copy.auditBoardEnable;
    default:
      return action;
  }
}
