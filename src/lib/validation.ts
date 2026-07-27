import { z } from "zod";
import {
  MAX_COMMENT_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_TITLE_LENGTH,
} from "@/lib/constants";

export const createBoardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Название слишком короткое")
    .max(80, "Название слишком длинное"),
  organizerName: z
    .string()
    .trim()
    .min(1, "Укажите ваше имя")
    .max(MAX_DISPLAY_NAME_LENGTH, "Имя слишком длинное"),
  inviteCount: z.coerce.number().int().min(1).max(20).default(5),
});

export const claimInviteSchema = z.object({
  token: z.string().trim().min(10).max(128),
  displayName: z
    .string()
    .trim()
    .min(1, "Укажите имя")
    .max(MAX_DISPLAY_NAME_LENGTH, "Имя слишком длинное"),
});

export const createCardSchema = z.object({
  boardId: z.string().cuid(),
  type: z.enum(["question", "task"]),
  title: z
    .string()
    .trim()
    .min(2, "Заголовок слишком короткий")
    .max(MAX_TITLE_LENGTH),
  description: z.string().trim().max(MAX_DESCRIPTION_LENGTH).default(""),
});

export const moveCardSchema = z.object({
  boardId: z.string().cuid(),
  cardId: z.string().cuid(),
  status: z.enum(["new", "in_progress", "answered", "done"]),
});

export const addCommentSchema = z.object({
  boardId: z.string().cuid(),
  cardId: z.string().cuid(),
  body: z
    .string()
    .trim()
    .min(1, "Комментарий пустой")
    .max(MAX_COMMENT_LENGTH),
});
