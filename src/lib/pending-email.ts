import "server-only";

import { cookies } from "next/headers";
import {
  PENDING_EMAIL_COOKIE_NAME,
  PENDING_EMAIL_MAX_AGE_SECONDS,
} from "@/lib/constants";
import { normalizeEmail } from "@/lib/account-link";

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

/** Address for the check-email screen. This is not an account session. */
export async function setPendingEmailCookie(email: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    PENDING_EMAIL_COOKIE_NAME,
    normalizeEmail(email),
    cookieOptions(PENDING_EMAIL_MAX_AGE_SECONDS),
  );
}

export async function getPendingEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(PENDING_EMAIL_COOKIE_NAME)?.value?.trim() ?? "";
  if (!value.includes("@") || value.length > 200) {
    return null;
  }
  return value;
}

export async function clearPendingEmailCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PENDING_EMAIL_COOKIE_NAME, "", cookieOptions(0));
}
