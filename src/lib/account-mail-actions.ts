"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { setAccountCookie } from "@/lib/account-session";
import {
  confirmEmailAddress,
  resendVerificationEmail,
  resetPasswordWithToken,
  sendPasswordResetEmail,
} from "@/lib/account-mail";
import { isEmailTokenShape } from "@/lib/email-token";
import { mapZodMessage, tErrors } from "@/lib/i18n-errors";
import { clearPendingEmailCookie } from "@/lib/pending-email";
import {
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@/lib/constants";
import type { ActionResult } from "@/types/actions";

const emailSchema = z.object({
  email: z.string().trim().min(1).max(MAX_EMAIL_LENGTH).email("emailInvalid"),
});

const passwordSchema = z.object({
  token: z.string().refine(isEmailTokenShape, "resetInvalid"),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, "passwordShort")
    .max(MAX_PASSWORD_LENGTH),
});

export async function requestPasswordResetAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }
  const result = await sendPasswordResetEmail(parsed.data.email);
  if (result === "unconfigured") {
    return { ok: false, error: errors.mailFailed };
  }
  return { ok: true, data: undefined };
}

export async function resendVerificationAction(
  email: string,
): Promise<ActionResult> {
  const errors = await tErrors();
  const parsed = emailSchema.safeParse({ email });
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }
  const result = await resendVerificationEmail(parsed.data.email);
  if (result === "unconfigured") {
    return { ok: false, error: errors.mailFailed };
  }
  return { ok: true, data: undefined };
}

export async function confirmEmailAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const token = String(formData.get("token") ?? "");
  const account = await confirmEmailAddress(token);
  if (!account) {
    return { ok: false, error: errors.resetInvalid };
  }
  await setAccountCookie({
    userId: account.id,
    sessionVersion: account.sessionVersion,
  });
  await clearPendingEmailCookie();
  redirect("/email-confirmed");
}

export async function resetPasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const parsed = passwordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }
  const account = await resetPasswordWithToken(
    parsed.data.token,
    parsed.data.password,
  );
  if (!account) {
    return { ok: false, error: errors.resetInvalid };
  }
  await setAccountCookie({
    userId: account.id,
    sessionVersion: account.sessionVersion,
  });
  await clearPendingEmailCookie();
  redirect("/password-updated");
}
