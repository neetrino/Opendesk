import { createHash, timingSafeEqual } from "node:crypto";

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/** Constant-time string compare (length-independent via SHA-256). */
export function safeEqualSecret(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}
