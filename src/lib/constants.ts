import type { CardStatus, CardType } from "@prisma/client";

export const SESSION_COOKIE_NAME = "opendesk_session";

export const CARD_COLUMNS: ReadonlyArray<{
  status: CardStatus;
  label: string;
}> = [
  { status: "new", label: "Новое" },
  { status: "in_progress", label: "В процессе" },
  { status: "answered", label: "Ответ дан" },
  { status: "done", label: "Завершено" },
] as const;

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  question: "Вопрос",
  task: "Задача",
};

export const DEFAULT_INVITE_COUNT = 5;
export const MAX_DISPLAY_NAME_LENGTH = 40;
export const MAX_TITLE_LENGTH = 120;
export const MAX_DESCRIPTION_LENGTH = 4000;
export const MAX_COMMENT_LENGTH = 2000;
