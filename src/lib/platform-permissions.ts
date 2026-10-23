import type { UserRole } from "@prisma/client";

export const PLATFORM_PERMISSIONS = [
  "admin.users.read",
  "admin.users.disable",
  "admin.users.setRole",
  "admin.boards.read",
  "admin.boards.disable",
  "admin.audit.read",
] as const;

export type PlatformPermission = (typeof PLATFORM_PERMISSIONS)[number];

const ADMIN_PERMISSIONS = new Set<PlatformPermission>(PLATFORM_PERMISSIONS);

/** Platform role only. Board ownership is a separate check. */
export function hasPermission(
  role: UserRole,
  permission: PlatformPermission,
): boolean {
  if (role === "platform_admin") {
    return ADMIN_PERMISSIONS.has(permission);
  }
  return false;
}
