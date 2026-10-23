import { createHash, randomBytes } from "node:crypto";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** Raw token for the letter button. Only the SHA-256 hash is stored. */
export function createEmailToken(): { raw: string; tokenHash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, tokenHash: hashEmailToken(raw) };
}

export function hashEmailToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function isEmailTokenShape(raw: string): boolean {
  return TOKEN_PATTERN.test(raw);
}

export function isEmailTokenCurrent(expiresAt: Date, now: Date): boolean {
  return expiresAt.getTime() > now.getTime();
}
