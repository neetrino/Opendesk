import { createHash, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  OWNER_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/constants";

export type OwnerSessionPayload = {
  role: "owner";
};

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/** Constant-time string compare (length-independent via SHA-256). */
export function safeEqualSecret(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

export function getOwnerCredentials(): { login: string; password: string } | null {
  const login = process.env.OWNER_LOGIN?.trim() ?? "";
  const password = process.env.OWNER_PASSWORD ?? "";
  if (!login || !password) {
    return null;
  }
  return { login, password };
}

export function verifyOwnerCredentials(
  login: string,
  password: string,
): boolean {
  const expected = getOwnerCredentials();
  if (!expected) {
    return false;
  }
  const loginOk = safeEqualSecret(login.trim(), expected.login);
  const passwordOk = safeEqualSecret(password, expected.password);
  return loginOk && passwordOk;
}

export async function createOwnerSessionToken(): Promise<string> {
  const payload: OwnerSessionPayload = { role: "owner" };
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretKey());
}

export async function verifyOwnerSessionToken(
  token: string,
): Promise<OwnerSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role !== "owner") {
      return null;
    }
    return { role: "owner" };
  } catch {
    return null;
  }
}

export async function getOwnerSession(): Promise<OwnerSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(OWNER_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifyOwnerSessionToken(token);
}

export async function setOwnerSessionCookie(): Promise<void> {
  const token = await createOwnerSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(OWNER_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearOwnerSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(OWNER_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function requireOwnerSession(): Promise<OwnerSessionPayload> {
  const session = await getOwnerSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
