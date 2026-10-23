import "server-only";

import { LOGIN_LOCK_MS } from "@/lib/constants";
import { nextLoginFailure, normalizeEmail } from "@/lib/account-link";
import { dummyPasswordHash, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string;
  role: "member" | "platform_admin";
  sessionVersion: number;
};

export type AuthenticateResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; reason: "invalid" | "locked" };

/**
 * One failure message for a bad password, an unknown mailbox, and a disabled
 * account. A lock that is already in force is reported separately.
 */
export async function authenticate(
  email: string,
  password: string,
): Promise<AuthenticateResult> {
  const normalized = normalizeEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      passwordHash: true,
      disabledAt: true,
      sessionVersion: true,
      failedLoginCount: true,
      lockedUntil: true,
    },
  });

  if (!user || user.disabledAt) {
    await verifyPassword(await dummyPasswordHash(), password);
    return { ok: false, reason: "invalid" };
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    return { ok: false, reason: "locked" };
  }

  const matches = await verifyPassword(user.passwordHash, password);
  if (!matches) {
    const failure = nextLoginFailure(user.failedLoginCount);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: failure.failedLoginCount,
        lockedUntil: failure.locked
          ? new Date(Date.now() + LOGIN_LOCK_MS)
          : null,
      },
    });
    return { ok: false, reason: "invalid" };
  }

  if (user.failedLoginCount !== 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
  }

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      sessionVersion: user.sessionVersion,
    },
  };
}
