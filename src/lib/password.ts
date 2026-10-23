import argon2 from "argon2";

/** OWASP argon2id baseline: 19 MiB, 2 iterations, parallelism 1. */
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

let dummyHash: Promise<string> | null = null;

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}

/** Hash used when the mailbox does not exist, so the response time stays even. */
export function dummyPasswordHash(): Promise<string> {
  dummyHash ??= hashPassword("opendesk-timing-pad");
  return dummyHash;
}
