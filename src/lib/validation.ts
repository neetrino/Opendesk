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
    .min(2, "titleShort")
    .max(80, "titleLong"),
  organizerName: z
    .string()
    .trim()
    .min(1, "nameRequired")
    .max(MAX_DISPLAY_NAME_LENGTH, "nameLong"),
});

export const createInviteSchema = z.object({
  boardId: z.string().cuid(),
});

export const claimInviteSchema = z.object({
  token: z.string().trim().min(10).max(128),
  displayName: z
    .string()
    .trim()
    .min(1, "nameRequired")
    .max(MAX_DISPLAY_NAME_LENGTH, "nameLong"),
});

export const createCardSchema = z.object({
  boardId: z.string().cuid(),
  type: z.enum(["question", "task"]),
  status: z.enum(["new", "in_progress", "answered", "done"]).default("new"),
  title: z
    .string()
    .trim()
    .min(2, "cardTitleShort")
    .max(MAX_TITLE_LENGTH),
  description: z.string().trim().max(MAX_DESCRIPTION_LENGTH).default(""),
  urgent: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => value === true || value === "on" || value === "true"),
});

export const moveCardSchema = z.object({
  boardId: z.string().cuid(),
  cardId: z.string().cuid(),
  status: z.enum(["new", "in_progress", "answered", "done"]),
});

export const setCardUrgentSchema = z.object({
  boardId: z.string().cuid(),
  cardId: z.string().cuid(),
  urgent: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .transform((value) => value === true || value === "true"),
});

export const updateCardContentSchema = z.object({
  boardId: z.string().cuid(),
  cardId: z.string().cuid(),
  title: z
    .string()
    .trim()
    .min(2, "cardTitleShort")
    .max(MAX_TITLE_LENGTH),
  description: z.string().trim().max(MAX_DESCRIPTION_LENGTH).default(""),
});

export const addCommentSchema = z.object({
  boardId: z.string().cuid(),
  cardId: z.string().cuid(),
  body: z
    .string()
    .trim()
    .min(1, "commentEmpty")
    .max(MAX_COMMENT_LENGTH),
});
