import { buildJoinPath, parseJoinPath } from "@/lib/join-url";

export type LastBoardCookieUpdate =
  | { kind: "invalid" }
  | { kind: "keep" }
  | { kind: "set"; value: string };

/**
 * Decide whether the owner last-board cookie should change.
 * Invalid paths are rejected; an already-canonical value is left untouched
 * so a revisit does not emit Set-Cookie.
 */
export function resolveLastBoardCookieUpdate(
  currentValue: string | undefined,
  path: string,
): LastBoardCookieUpdate {
  const parsed = parseJoinPath(path);
  if (!parsed) {
    return { kind: "invalid" };
  }

  const value = buildJoinPath(parsed.slug, parsed.joinToken);
  if (currentValue === value) {
    return { kind: "keep" };
  }

  return { kind: "set", value };
}
