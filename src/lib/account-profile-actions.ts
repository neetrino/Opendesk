"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendPasswordChangedEmail } from "@/lib/account-mail";
import { requireAccount, setAccountCookie } from "@/lib/account-session";
import { mapZodMessage, tErrors } from "@/lib/i18n-errors";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  MAX_DISPLAY_NAME_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@/lib/constants";
import type { ActionResult } from "@/types/actions";

const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "nameRequired")
    .max(MAX_DISPLAY_NAME_LENGTH, "nameLong"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(MAX_PASSWORD_LENGTH),
  nextPassword: z
    .string()
    .min(MIN_PASSWORD_LENGTH, "passwordShort")
    .max(MAX_PASSWORD_LENGTH),
  confirmPassword: z.string().max(MAX_PASSWORD_LENGTH),
});

export async function updateProfileAction(
  formData: FormData,
): Promise<ActionResult> {
  const account = await requireAccount();
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  await prisma.user.update({
    where: { id: account.id },
    data: { displayName: parsed.data.displayName },
  });
  revalidatePath("/account");
  revalidatePath("/boards");
  revalidatePath("/admin");
  return { ok: true, data: undefined };
}

export async function changePasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const account = await requireAccount();
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    nextPassword: formData.get("nextPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }
  if (parsed.data.nextPassword !== parsed.data.confirmPassword) {
    return { ok: false, error: errors.passwordMismatch };
  }
  if (parsed.data.currentPassword === parsed.data.nextPassword) {
    return { ok: false, error: errors.passwordSame };
  }

  const user = await prisma.user.findUnique({
    where: { id: account.id },
    select: { passwordHash: true, email: true },
  });
  if (!user) {
    return { ok: false, error: errors.unauthorized };
  }
  const matches = await verifyPassword(
    user.passwordHash,
    parsed.data.currentPassword,
  );
  if (!matches) {
    return { ok: false, error: errors.currentPasswordWrong };
  }

  const passwordHash = await hashPassword(parsed.data.nextPassword);
  const updated = await prisma.user.update({
    where: { id: account.id },
    data: {
      passwordHash,
      sessionVersion: { increment: 1 },
      failedLoginCount: 0,
      lockedUntil: null,
    },
    select: { id: true, sessionVersion: true },
  });
  await setAccountCookie({
    userId: updated.id,
    sessionVersion: updated.sessionVersion,
  });
  await sendPasswordChangedEmail(user.email);
  return { ok: true, data: undefined };
}
