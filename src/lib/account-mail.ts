import "server-only";

import type { AuthEmailPurpose } from "@prisma/client";
import type { Locale } from "@/i18n/config";
import { getLocale } from "@/i18n/locale";
import { normalizeEmail } from "@/lib/account-link";
import {
  RESET_PASSWORD_TTL_MS,
  VERIFY_EMAIL_TTL_MS,
} from "@/lib/constants";
import {
  confirmLetter,
  passwordChangedLetter,
  resetLetter,
  welcomeLetter,
} from "@/lib/email-messages";
import {
  createEmailToken,
  hashEmailToken,
  isEmailTokenCurrent,
  isEmailTokenShape,
} from "@/lib/email-token";
import { deliverAccountLetter, mailLogoUrl, readMailConfig } from "@/lib/mail";
import { hashPassword } from "@/lib/password";
import { setPendingEmailCookie } from "@/lib/pending-email";
import { prisma } from "@/lib/prisma";

export type SignedInAccount = {
  id: string;
  sessionVersion: number;
};

function tokenTtl(purpose: AuthEmailPurpose): number {
  return purpose === "verify_email" ? VERIFY_EMAIL_TTL_MS : RESET_PASSWORD_TTL_MS;
}

async function issueToken(
  userId: string,
  purpose: AuthEmailPurpose,
): Promise<string | null> {
  if (!readMailConfig()) {
    return null;
  }
  const { raw, tokenHash } = createEmailToken();
  await prisma.$transaction([
    prisma.authEmailToken.deleteMany({ where: { userId, purpose } }),
    prisma.authEmailToken.create({
      data: {
        userId,
        purpose,
        tokenHash,
        expiresAt: new Date(Date.now() + tokenTtl(purpose)),
      },
    }),
  ]);
  return raw;
}

function withToken(appUrl: string, path: string, raw: string): string {
  return `${appUrl}${path}?token=${encodeURIComponent(raw)}`;
}

/**
 * Welcome letter for a brand-new account, and a cookie so the next screen
 * can offer another copy without putting the address in the URL.
 */
export async function finishNewAccount(input: {
  userId: string;
  email: string;
  displayName: string;
}): Promise<boolean> {
  await setPendingEmailCookie(input.email);
  return sendWelcomeEmail(input);
}

export async function sendWelcomeEmail(input: {
  userId: string;
  email: string;
  displayName: string;
  locale?: Locale;
}): Promise<boolean> {
  const config = readMailConfig();
  if (!config) {
    return false;
  }
  const raw = await issueToken(input.userId, "verify_email");
  if (!raw) {
    return false;
  }
  const locale = input.locale ?? (await getLocale());
  const built = welcomeLetter(locale, {
    name: input.displayName,
    confirmUrl: withToken(config.appUrl, "/verify-email", raw),
    logoUrl: mailLogoUrl(config.appUrl),
  });
  return deliverAccountLetter({
    to: input.email,
    subject: built.subject,
    letter: built.letter,
  });
}

/**
 * Same response whether the address exists. A disabled account and an
 * already confirmed address get no letter.
 */
export async function resendVerificationEmail(email: string): Promise<"sent" | "unconfigured"> {
  const config = readMailConfig();
  if (!config) {
    return "unconfigured";
  }
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true, disabledAt: true, emailVerifiedAt: true, email: true },
  });
  if (!user || user.disabledAt || user.emailVerifiedAt) {
    return "sent";
  }
  const raw = await issueToken(user.id, "verify_email");
  if (!raw) {
    return "unconfigured";
  }
  const built = confirmLetter(await getLocale(), {
    confirmUrl: withToken(config.appUrl, "/verify-email", raw),
    logoUrl: mailLogoUrl(config.appUrl),
  });
  await deliverAccountLetter({
    to: user.email,
    subject: built.subject,
    letter: built.letter,
  });
  return "sent";
}

/** Same response whether the address exists. Disabled accounts get no letter. */
export async function sendPasswordResetEmail(
  email: string,
): Promise<"sent" | "unconfigured"> {
  const config = readMailConfig();
  if (!config) {
    return "unconfigured";
  }
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true, disabledAt: true, email: true },
  });
  if (!user || user.disabledAt) {
    return "sent";
  }
  const raw = await issueToken(user.id, "reset_password");
  if (!raw) {
    return "unconfigured";
  }
  const built = resetLetter(await getLocale(), {
    resetUrl: withToken(config.appUrl, "/reset-password", raw),
    logoUrl: mailLogoUrl(config.appUrl),
  });
  await deliverAccountLetter({
    to: user.email,
    subject: built.subject,
    letter: built.letter,
  });
  return "sent";
}

export async function peekEmailToken(
  raw: string,
  purpose: AuthEmailPurpose,
): Promise<"ready" | "invalid"> {
  if (!isEmailTokenShape(raw)) {
    return "invalid";
  }
  const row = await prisma.authEmailToken.findUnique({
    where: { tokenHash: hashEmailToken(raw) },
    select: {
      purpose: true,
      expiresAt: true,
      user: { select: { disabledAt: true } },
    },
  });
  if (
    !row ||
    row.purpose !== purpose ||
    !isEmailTokenCurrent(row.expiresAt, new Date()) ||
    row.user.disabledAt
  ) {
    return "invalid";
  }
  return "ready";
}

export async function confirmEmailAddress(
  raw: string,
): Promise<SignedInAccount | null> {
  if (!isEmailTokenShape(raw)) {
    return null;
  }
  const tokenHash = hashEmailToken(raw);
  return prisma.$transaction(async (tx) => {
    const row = await tx.authEmailToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        purpose: true,
        expiresAt: true,
        userId: true,
        user: { select: { disabledAt: true, sessionVersion: true } },
      },
    });
    if (
      !row ||
      row.purpose !== "verify_email" ||
      !isEmailTokenCurrent(row.expiresAt, new Date()) ||
      row.user.disabledAt
    ) {
      return null;
    }
    const deleted = await tx.authEmailToken.deleteMany({
      where: { id: row.id, purpose: "verify_email" },
    });
    if (deleted.count !== 1) {
      return null;
    }
    await tx.user.update({
      where: { id: row.userId },
      data: {
        emailVerifiedAt: new Date(),
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
    return { id: row.userId, sessionVersion: row.user.sessionVersion };
  });
}

export async function resetPasswordWithToken(
  raw: string,
  password: string,
): Promise<SignedInAccount | null> {
  if (!isEmailTokenShape(raw)) {
    return null;
  }
  const passwordHash = await hashPassword(password);
  const tokenHash = hashEmailToken(raw);
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.authEmailToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        purpose: true,
        expiresAt: true,
        userId: true,
        user: {
          select: {
            disabledAt: true,
            emailVerifiedAt: true,
            email: true,
          },
        },
      },
    });
    if (
      !row ||
      row.purpose !== "reset_password" ||
      !isEmailTokenCurrent(row.expiresAt, new Date()) ||
      row.user.disabledAt
    ) {
      return null;
    }
    const deleted = await tx.authEmailToken.deleteMany({
      where: { id: row.id, purpose: "reset_password" },
    });
    if (deleted.count !== 1) {
      return null;
    }
    const user = await tx.user.update({
      where: { id: row.userId },
      data: {
        passwordHash,
        sessionVersion: { increment: 1 },
        emailVerifiedAt: row.user.emailVerifiedAt ?? new Date(),
        failedLoginCount: 0,
        lockedUntil: null,
      },
      select: { id: true, sessionVersion: true, email: true },
    });
    await tx.authEmailToken.deleteMany({ where: { userId: row.userId } });
    return user;
  });
  if (!updated) {
    return null;
  }

  await sendPasswordChangedEmail(updated.email);
  return { id: updated.id, sessionVersion: updated.sessionVersion };
}

/** Confirmation that the password changed. No reset token is included. */
export async function sendPasswordChangedEmail(email: string): Promise<void> {
  const config = readMailConfig();
  if (!config) {
    return;
  }
  const built = passwordChangedLetter(await getLocale(), {
    email,
    signInUrl: `${config.appUrl}/login`,
    resetUrl: `${config.appUrl}/forgot-password`,
    logoUrl: mailLogoUrl(config.appUrl),
  });
  await deliverAccountLetter({
    to: email,
    subject: built.subject,
    letter: built.letter,
  });
}
