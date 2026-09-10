"use server";

import { isLocalCardId } from "@/lib/local-cards";
import {
  attachmentKindFor,
  attachmentLimitFor,
  buildObjectKey,
  resolveContentType,
  sanitizeFilename,
  type AttachmentUploadTarget,
} from "@/lib/attachments";
import { requireBoardAccess } from "@/lib/board-access";
import { mapZodMessage, tErrors } from "@/lib/i18n-errors";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { revalidateBoardPath } from "@/lib/revalidate-board";
import {
  createAttachmentUploadUrl,
  deleteStoredObject,
  isR2Configured,
} from "@/lib/r2";
import {
  createAttachmentUploadSchema,
  deleteAttachmentSchema,
} from "@/lib/validation";
import type { ActionResult } from "@/types/actions";

export type AttachmentUploadPayload = {
  uploadUrl: string;
  objectKey: string;
  contentType: string;
  kind: "image" | "video";
  filename: string;
};

function mapStorageError(
  error: unknown,
  errors: Awaited<ReturnType<typeof tErrors>>,
): string {
  if (!(error instanceof Error)) {
    return errors.uploadFailed;
  }
  if (error.message === "UNAUTHORIZED") {
    return errors.unauthorized;
  }
  if (error.message === "R2_NOT_CONFIGURED") {
    return errors.storageNotConfigured;
  }
  if (error.message === "FILE_TOO_LARGE") {
    return errors.fileTooLarge;
  }
  if (error.message === "FILE_TYPE") {
    return errors.fileTypeUnsupported;
  }
  if (error.message === "VALIDATION") {
    return errors.validation;
  }
  return errors.uploadFailed;
}

async function requirePersistedCard(boardId: string, cardId: string) {
  if (isLocalCardId(cardId)) {
    return null;
  }
  return prisma.card.findFirst({
    where: { id: cardId, boardId },
    select: { id: true },
  });
}

async function isOverAttachmentLimit(
  cardId: string,
  target: AttachmentUploadTarget,
): Promise<boolean> {
  const { where, limit } = attachmentLimitFor(cardId, target);
  const existingCount = await prisma.attachment.count({ where });
  return existingCount >= limit;
}

export async function createAttachmentUploadAction(
  input: unknown,
): Promise<ActionResult<AttachmentUploadPayload>> {
  const errors = await tErrors();
  if (!isR2Configured()) {
    return { ok: false, error: errors.storageNotConfigured };
  }

  const parsed = createAttachmentUploadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  const contentType = resolveContentType(
    parsed.data.contentType,
    parsed.data.filename,
  );
  if (!contentType) {
    return { ok: false, error: errors.fileTypeUnsupported };
  }

  try {
    const access = await requireBoardAccess(parsed.data.boardId);
    const limited = checkRateLimit(
      `upload:${access.participantId}`,
      30,
      60_000,
    );
    if (!limited.allowed) {
      return { ok: false, error: errors.uploadFailed };
    }

    const card = await requirePersistedCard(
      parsed.data.boardId,
      parsed.data.cardId,
    );
    if (!card) {
      return { ok: false, error: errors.cardNotFound };
    }

    if (await isOverAttachmentLimit(card.id, parsed.data.target)) {
      return { ok: false, error: errors.attachmentLimit };
    }

    const objectKey = buildObjectKey(
      parsed.data.boardId,
      card.id,
      contentType,
    );
    const uploadUrl = await createAttachmentUploadUrl(objectKey, contentType);

    return {
      ok: true,
      data: {
        uploadUrl,
        objectKey,
        contentType,
        kind: attachmentKindFor(contentType),
        filename: sanitizeFilename(parsed.data.filename),
      },
    };
  } catch (error) {
    logger.error("createAttachmentUploadAction failed", error);
    return { ok: false, error: mapStorageError(error, errors) };
  }
}

export async function deleteAttachmentAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const parsed = deleteAttachmentSchema.safeParse({
    boardId: formData.get("boardId"),
    attachmentId: formData.get("attachmentId"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  try {
    const access = await requireBoardAccess(parsed.data.boardId);
    const attachment = await prisma.attachment.findFirst({
      where: {
        id: parsed.data.attachmentId,
        boardId: parsed.data.boardId,
      },
    });
    if (!attachment) {
      return { ok: false, error: errors.attachmentNotFound };
    }
    if (!access.isOwner && attachment.authorId !== access.participantId) {
      return { ok: false, error: errors.unauthorized };
    }

    await prisma.attachment.delete({ where: { id: attachment.id } });
    await deleteStoredObject(attachment.objectKey);
    await revalidateBoardPath(parsed.data.boardId);
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    logger.error("deleteAttachmentAction failed", error);
    return { ok: false, error: errors.deleteAttachment };
  }
}
