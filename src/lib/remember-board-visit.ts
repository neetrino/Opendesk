"use server";

import { cookies } from "next/headers";
import {
  LAST_BOARD_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/constants";
import { buildJoinPath, parseJoinPath } from "@/lib/join-url";
import { getOwnerSession } from "@/lib/owner-session";

/** Remember only a board that has already rendered for an authenticated owner. */
export async function rememberOwnerBoardVisit(path: string): Promise<void> {
  const owner = await getOwnerSession();
  const parsed = parseJoinPath(path);
  if (!owner || !parsed) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(
    LAST_BOARD_COOKIE_NAME,
    buildJoinPath(parsed.slug, parsed.joinToken),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
  );
}
