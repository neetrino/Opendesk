"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { setAccountCookie, clearAccountCookie } from "@/lib/account-session";
import { finishNewAccount, resendVerificationEmail } from "@/lib/account-mail";
import { authenticate } from "@/lib/authenticate";
import { setPendingEmailCookie } from "@/lib/pending-email";
import { normalizeEmail } from "@/lib/account-link";
import { mapZodMessage, tErrors } from "@/lib/i18n-errors";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { isUniqueConflict } from "@/lib/join-board";
import { clearSessionCookie, getSession } from "@/lib/session";
import {
  MAX_DISPLAY_NAME_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@/lib/constants";
import type { ActionResult } from "@/types/actions";

const credentialsSchema = z.object({
  email: z.string().trim().min(1).max(MAX_EMAIL_LENGTH).email("emailInvalid"),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, "passwordShort")
    .max(MAX_PASSWORD_LENGTH),
});

const registerSchema = credentialsSchema.extend({
  displayName: z
    .string()
    .trim()
    .min(1, "nameRequired")
    .max(MAX_DISPLAY_NAME_LENGTH, "nameLong"),
});

export async function loginAccountAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  const result = await authenticate(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    if (result.reason === "unverified") {
      return { ok: false, error: errors.emailUnverified, code: "unverified" };
    }
    return {
      ok: false,
      error: result.reason === "locked" ? errors.accountLocked : errors.invalidCredentials,
    };
  }

  await setAccountCookie({
    userId: result.user.id,
    sessionVersion: result.user.sessionVersion,
  });
  redirect("/boards");
}

export async function registerAccountAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const parsed = registerSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  const email = normalizeEmail(parsed.data.email);
  let userId: string;
  try {
    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: parsed.data.displayName,
        role: "member",
      },
      select: { id: true },
    });
    userId = user.id;
  } catch (error) {
    if (isUniqueConflict(error)) {
      return { ok: false, error: errors.emailTaken };
    }
    throw error;
  }

  const sent = await finishNewAccount({
    userId,
    email,
    displayName: parsed.data.displayName,
  });
  redirect(sent ? "/check-email" : "/check-email?notice=delayed");
}

/**
 * Binds the current guest seat to a new or existing account.
 * A plain login elsewhere does not call this.
 */
export async function claimGuestAccountAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const session = await getSession();
  if (!session) {
    return { ok: false, error: errors.unauthorized };
  }

  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  const participant = await prisma.participant.findFirst({
    where: { id: session.participantId, boardId: session.boardId },
    select: { id: true, displayName: true, userId: true },
  });
  if (!participant) {
    return { ok: false, error: errors.unauthorized };
  }
  if (participant.userId) {
    return { ok: false, error: errors.claimFailed };
  }

  const email = normalizeEmail(parsed.data.email);
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!existing) {
    let userId: string;
    try {
      const passwordHash = await hashPassword(parsed.data.password);
      const user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email,
            passwordHash,
            displayName: participant.displayName,
            role: "member",
          },
          select: { id: true },
        });
        const linked = await tx.participant.updateMany({
          where: { id: participant.id, userId: null },
          data: { userId: created.id },
        });
        if (linked.count !== 1) {
          throw new Error("CLAIM_CONFLICT");
        }
        return created;
      });
      userId = user.id;
    } catch (error) {
      if (error instanceof Error && error.message === "CLAIM_CONFLICT") {
        return { ok: false, error: errors.claimFailed };
      }
      if (isUniqueConflict(error)) {
        return { ok: false, error: errors.emailTaken };
      }
      throw error;
    }
    const sent = await finishNewAccount({
      userId,
      email,
      displayName: participant.displayName,
    });
    redirect(sent ? "/check-email" : "/check-email?notice=delayed");
  }

  const auth = await authenticate(email, parsed.data.password);
  if (!auth.ok) {
    if (auth.reason !== "unverified") {
      return {
        ok: false,
        error: auth.reason === "locked" ? errors.accountLocked : errors.invalidCredentials,
      };
    }
    const linked = await prisma.participant.updateMany({
      where: { id: participant.id, userId: null },
      data: { userId: auth.user.id },
    });
    if (linked.count !== 1) {
      return { ok: false, error: errors.claimFailed };
    }
    await setPendingEmailCookie(email);
    const sent = await resendVerificationEmail(email);
    redirect(sent === "sent" ? "/check-email" : "/check-email?notice=delayed");
  }

  const linked = await prisma.participant.updateMany({
    where: { id: participant.id, userId: null },
    data: { userId: auth.user.id },
  });
  if (linked.count !== 1) {
    return { ok: false, error: errors.claimFailed };
  }

  await setAccountCookie({
    userId: auth.user.id,
    sessionVersion: auth.user.sessionVersion,
  });
  redirect("/boards");
}

export async function logoutAccountAction(): Promise<void> {
  await clearSessionCookie();
  await clearAccountCookie();
  redirect("/login");
}
