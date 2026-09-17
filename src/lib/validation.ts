import { z } from "zod";
import { ATTACHMENT_CONTENT_TYPES } from "@/lib/attachments";
import {
  COMMENT_REACTION_EMOJIS,
  LABEL_COLOR_KEYS,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_FILENAME_LENGTH,
  MAX_BOARD_LABELS,
  MAX_COMMENT_ATTACHMENTS,
  MAX_COMMENT_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_LABEL_NAME_LENGTH,
  MAX_TITLE_LENGTH,
} from "@/lib/constants";

export const createBoardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "titleShort")
    .max(80, "titleLong"),
});

export const joinBoardSchema = z.object({
  token: z.string().trim().min(10).max(128),
  displayName: z
    .string()
    .trim()
    .min(1, "nameRequired")
    .max(MAX_DISPLAY_NAME_LENGTH, "nameLong"),
});

/** Legacy one-time invite claim — same shape as permanent join. */
export const claimInviteSchema = joinBoardSchema;

export const createCardSchema = z.object({
  boardId: z.string().cuid(),
  status: z.enum(["new", "in_progress", "answered", "done"]).default("new"),
  title: z
    .string()
    .trim()
    .min(2, "cardTitleShort")
    .max(MAX_TITLE_LENGTH),
  urgent: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => value === true || value === "on" || value === "true"),
  labelIds: z
    .string()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id.length > 0),
    )
    .pipe(z.array(z.string().cuid()).max(MAX_BOARD_LABELS)),
});

const optionalCuid = z
  .union([z.string().cuid(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined));

export const moveCardSchema = z
  .object({
    boardId: z.string().cuid(),
    cardId: z.string().cuid(),
    status: z.enum(["new", "in_progress", "answered", "done"]),
    beforeCardId: optionalCuid,
    afterCardId: optionalCuid,
  })
  .refine((value) => !(value.beforeCardId && value.afterCardId), {
    message: "validation",
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
});

export const deleteCardSchema = z.object({
  boardId: z.string().cuid(),
  cardId: z.string().cuid(),
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

export const attachmentMetaSchema = z.object({
  objectKey: z.string().trim().min(20).max(500),
  filename: z
    .string()
    .trim()
    .min(1)
    .max(MAX_ATTACHMENT_FILENAME_LENGTH),
  contentType: z.enum(ATTACHMENT_CONTENT_TYPES),
  byteSize: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
});

export const createAttachmentUploadSchema = z.object({
  boardId: z.string().cuid(),
  cardId: z.string().cuid(),
  filename: z
    .string()
    .trim()
    .min(1)
    .max(MAX_ATTACHMENT_FILENAME_LENGTH),
  contentType: z.string().trim().min(1).max(120),
  byteSize: z
    .number()
    .int()
    .positive()
    .max(MAX_ATTACHMENT_BYTES, "fileTooLarge"),
  target: z.enum(["card", "comment"]),
});

export const completeCardAttachmentSchema = z.object({
  boardId: z.string().cuid(),
  cardId: z.string().cuid(),
  objectKey: z.string().trim().min(20).max(500),
  filename: z
    .string()
    .trim()
    .min(1)
    .max(MAX_ATTACHMENT_FILENAME_LENGTH),
  contentType: z.enum(ATTACHMENT_CONTENT_TYPES),
  byteSize: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
});

export const deleteAttachmentSchema = z.object({
  boardId: z.string().cuid(),
  attachmentId: z.string().cuid(),
});

export const addCommentWithAttachmentsSchema = z
  .object({
    boardId: z.string().cuid(),
    cardId: z.string().cuid(),
    body: z.string().trim().max(MAX_COMMENT_LENGTH).default(""),
    parentId: optionalCuid,
    attachments: z
      .array(attachmentMetaSchema)
      .max(MAX_COMMENT_ATTACHMENTS)
      .default([]),
  })
  .refine(
    (value) => value.body.length > 0 || value.attachments.length > 0,
    { message: "commentEmpty" },
  );

export const editCommentSchema = z.object({
  boardId: z.string().cuid(),
  cardId: z.string().cuid(),
  commentId: z.string().cuid(),
  body: z.string().trim().min(1, "commentEmpty").max(MAX_COMMENT_LENGTH),
});

export const commentTargetSchema = z.object({
  boardId: z.string().cuid(),
  cardId: z.string().cuid(),
  commentId: z.string().cuid(),
});

export const toggleCommentReactionSchema = commentTargetSchema.extend({
  emoji: z.enum(COMMENT_REACTION_EMOJIS),
});

export const setCardPinnedCommentSchema = z.object({
  boardId: z.string().cuid(),
  cardId: z.string().cuid(),
  commentId: optionalCuid,
});

export const createCardFromCommentSchema = z.object({
  boardId: z.string().cuid(),
  cardId: z.string().cuid(),
  commentId: z.string().cuid(),
  title: z
    .string()
    .trim()
    .min(2, "cardTitleShort")
    .max(MAX_TITLE_LENGTH),
});

export const createBoardLabelSchema = z.object({
  boardId: z.string().cuid(),
  cardId: optionalCuid,
  name: z
    .string()
    .trim()
    .min(1, "validation")
    .max(MAX_LABEL_NAME_LENGTH),
  color: z.enum(LABEL_COLOR_KEYS).optional(),
});

export const setCardLabelSchema = z.object({
  boardId: z.string().cuid(),
  cardId: z.string().cuid(),
  labelId: z.string().cuid(),
  assigned: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .transform((value) => value === true || value === "true"),
});

export const setBoardLabelColorSchema = z.object({
  boardId: z.string().cuid(),
  labelId: z.string().cuid(),
  color: z.enum(LABEL_COLOR_KEYS),
});

export const renameBoardLabelSchema = z.object({
  boardId: z.string().cuid(),
  labelId: z.string().cuid(),
  name: z
    .string()
    .trim()
    .min(1, "validation")
    .max(MAX_LABEL_NAME_LENGTH),
});

export const deleteBoardLabelSchema = z.object({
  boardId: z.string().cuid(),
  labelId: z.string().cuid(),
});
