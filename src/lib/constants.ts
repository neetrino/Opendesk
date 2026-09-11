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
export const MAX_COMMENT_LENGTH = 2000;
/** Soft cap for people on one board. */
export const MAX_BOARD_PARTICIPANTS = 20;

export const MAX_ATTACHMENT_SIZE_MB = 200;
export const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024;
/** Typical iPhone 1080p length that still fits the size cap. */
export const VIDEO_DURATION_HINT_MINUTES = 2;
export const MAX_ATTACHMENT_FILENAME_LENGTH = 180;
export const MAX_CARD_ATTACHMENTS = 20;
export const MAX_COMMENT_ATTACHMENTS = 4;
/** Field voice notes: long enough to describe a site, still a small upload. */
export const MAX_VOICE_NOTE_SECONDS = 5 * 60;
/** Hold the in-app shutter this long, then keep holding to record video. */
export const CAMERA_LONG_PRESS_MS = 450;
/** Soft cap for in-app camera video, aligned with the size hint. */
export const MAX_CAMERA_VIDEO_SECONDS = VIDEO_DURATION_HINT_MINUTES * 60;
/** Long enough for a 200 MB PUT on a slow mobile link. */
export const ATTACHMENT_UPLOAD_URL_TTL_SECONDS = 15 * 60;
export const ATTACHMENT_DOWNLOAD_URL_TTL_SECONDS = 60 * 60;
