import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserRole } from "@prisma/client";
import {
  ACCOUNT_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export type AccountSessionPayload = {
  userId: string;
  sessionVersion: number;
};

export type AccountContext = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  sessionVersion: number;
};

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function createAccountSessionToken(
  payload: AccountSessionPayload,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretKey());
}

export async function verifyAccountSessionToken(
  token: string,
): Promise<AccountSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const userId = payload.userId;
    const sessionVersion = payload.sessionVersion;
    if (typeof userId !== "string" || typeof sessionVersion !== "number") {
      return null;
    }
    return { userId, sessionVersion };
  } catch {
    return null;
  }
}

export async function setAccountCookie(
  payload: AccountSessionPayload,
): Promise<void> {
  const token = await createAccountSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(ACCOUNT_COOKIE_NAME, token, cookieOptions(SESSION_MAX_AGE_SECONDS));
}

export async function clearAccountCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACCOUNT_COOKIE_NAME, "", cookieOptions(0));
}

/**
 * Live account. Role, disable, and sessionVersion are read from the database
 * so an admin change applies before the cookie expires.
 */
export async function getAccount(): Promise<AccountContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCOUNT_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  const payload = await verifyAccountSessionToken(token);
  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      disabledAt: true,
      emailVerifiedAt: true,
      sessionVersion: true,
    },
  });
  if (
    !user ||
    user.disabledAt ||
    !user.emailVerifiedAt ||
    user.sessionVersion !== payload.sessionVersion
  ) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    sessionVersion: user.sessionVersion,
  };
}

export async function requireAccount(): Promise<AccountContext> {
  const account = await getAccount();
  if (!account) {
    throw new Error("UNAUTHORIZED");
  }
  return account;
}
