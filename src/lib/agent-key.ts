import { createHash, randomBytes } from "node:crypto";
import { safeEqualSecret } from "@/lib/owner-session";

export const AGENT_KEY_TOKEN_PREFIX = "od_";
const AGENT_KEY_BYTES = 32;
const AGENT_KEY_PREFIX_LENGTH = 8;

const bearerSchema = new RegExp(
  `^Bearer\\s+(${AGENT_KEY_TOKEN_PREFIX}[A-Za-z0-9_-]+)$`,
);

/** One-time secret for a board agent. Only the hash is stored. */
export function createAgentKey(): string {
  return `${AGENT_KEY_TOKEN_PREFIX}${randomBytes(AGENT_KEY_BYTES).toString("base64url")}`;
}

export function hashAgentKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function agentKeyPrefix(key: string): string {
  return key.slice(0, AGENT_KEY_PREFIX_LENGTH);
}

export function agentKeyMatches(storedHash: string, key: string): boolean {
  return safeEqualSecret(storedHash, hashAgentKey(key));
}

export function parseBearerAgentKey(header: string | null): string | null {
  if (!header) {
    return null;
  }
  return bearerSchema.exec(header.trim())?.[1] ?? null;
}
