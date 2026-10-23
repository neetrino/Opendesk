import type { UserRole } from "@prisma/client";
import { LOGIN_FAILURE_LIMIT } from "@/lib/constants";

export type GuestNameJoin = "create" | "rejoin" | "claimed";

export type RoleChangeDecision = "ok" | "self" | "disabled" | "last_admin";

export type DisableUserDecision = "ok" | "last_admin";

/** Lower-case, trimmed mailbox. Callers still validate the shape. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Name-only join. A seat already tied to an account cannot be taken by name.
 */
export function decideGuestNameJoin(
  existing: { userId: string | null } | null,
): GuestNameJoin {
  if (!existing) {
    return "create";
  }
  if (existing.userId) {
    return "claimed";
  }
  return "rejoin";
}

/**
 * An account opening a board gets a new seat. Any existing name, guest or not, blocks it.
 */
export function decideAccountDisplayName(
  existing: { userId: string | null } | null,
): "create" | "taken" {
  if (existing) {
    return "taken";
  }
  return "create";
}

export function nextLoginFailure(
  failedLoginCount: number,
  limit = LOGIN_FAILURE_LIMIT,
): { failedLoginCount: number; locked: boolean } {
  const next = failedLoginCount + 1;
  if (next >= limit) {
    return { failedLoginCount: 0, locked: true };
  }
  return { failedLoginCount: next, locked: false };
}

export function decideRoleChange(input: {
  actorId: string;
  targetId: string;
  targetDisabled: boolean;
  targetRole: UserRole;
  nextRole: UserRole;
  otherActiveAdminCount: number;
}): RoleChangeDecision {
  if (input.actorId === input.targetId) {
    return "self";
  }
  if (input.targetDisabled && input.nextRole === "platform_admin") {
    return "disabled";
  }
  if (
    input.targetRole === "platform_admin" &&
    input.nextRole !== "platform_admin" &&
    input.otherActiveAdminCount < 1
  ) {
    return "last_admin";
  }
  return "ok";
}

export function decideDisableUser(input: {
  targetRole: UserRole;
  disable: boolean;
  otherActiveAdminCount: number;
}): DisableUserDecision {
  if (
    input.disable &&
    input.targetRole === "platform_admin" &&
    input.otherActiveAdminCount < 1
  ) {
    return "last_admin";
  }
  return "ok";
}
