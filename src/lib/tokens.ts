import { randomBytes } from "node:crypto";

export function createInviteToken(): string {
  return randomBytes(24).toString("base64url");
}
