import { randomBytes } from "node:crypto";

/** Opaque token for one-time invites and permanent board join links. */
export function createInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

export const createJoinToken = createInviteToken;
