import "server-only";

import { cookies } from "next/headers";
import {
  LAST_BOARD_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/constants";
import { resolveLastBoardCookieUpdate } from "@/lib/last-board-cookie";
import { getOwnerSession } from "@/lib/owner-session";

export type RememberOwnerLastBoardResult =
  | "updated"
  | "unchanged"
  | "unauthorized"
  | "invalid";

/** Remember only a board that has already rendered for an authenticated owner. */
export async function rememberOwnerLastBoardPath(
  path: string,
): Promise<RememberOwnerLastBoardResult> {
  const owner = await getOwnerSession();
  if (!owner) {
    return "unauthorized";
  }

  const cookieStore = await cookies();
  const decision = resolveLastBoardCookieUpdate(
    cookieStore.get(LAST_BOARD_COOKIE_NAME)?.value,
    path,
  );

  if (decision.kind === "invalid") {
    return "invalid";
  }

  if (decision.kind === "keep") {
    return "unchanged";
  }

  cookieStore.set(LAST_BOARD_COOKIE_NAME, decision.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return "updated";
}
