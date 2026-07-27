import type { CardStatus } from "@prisma/client";

export const CARD_STATUSES: ReadonlyArray<CardStatus> = [
  "new",
  "in_progress",
  "answered",
  "done",
] as const;

export const SESSION_COOKIE_NAME = "opendesk_session";

export const MAX_DISPLAY_NAME_LENGTH = 40;
export const MAX_TITLE_LENGTH = 120;
export const MAX_DESCRIPTION_LENGTH = 4000;
export const MAX_COMMENT_LENGTH = 2000;
/** Soft cap for people on one board (organizer + invitees). */
export const MAX_BOARD_PARTICIPANTS = 20;
