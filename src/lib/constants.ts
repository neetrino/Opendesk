import type { CardStatus } from "@prisma/client";

export const CARD_STATUSES: ReadonlyArray<CardStatus> = [
  "new",
  "in_progress",
  "answered",
  "done",
] as const;

export const SESSION_COOKIE_NAME = "opendesk_session";
export const OWNER_COOKIE_NAME = "opendesk_owner";

/** Stable display name for the env owner on each board (FK author). */
export const OWNER_PARTICIPANT_NAME = "Owner";

export const MAX_DISPLAY_NAME_LENGTH = 40;
export const MAX_TITLE_LENGTH = 120;
export const MAX_DESCRIPTION_LENGTH = 4000;
export const MAX_COMMENT_LENGTH = 2000;
/** Soft cap for people on one board. */
export const MAX_BOARD_PARTICIPANTS = 20;

export const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024;
export const MAX_ATTACHMENT_FILENAME_LENGTH = 180;
export const MAX_CARD_ATTACHMENTS = 20;
export const MAX_COMMENT_ATTACHMENTS = 4;
export const ATTACHMENT_UPLOAD_URL_TTL_SECONDS = 5 * 60;
export const ATTACHMENT_DOWNLOAD_URL_TTL_SECONDS = 60 * 60;
