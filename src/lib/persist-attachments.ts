import {
  attachmentKindFor,
  isOwnedObjectKey,
  sanitizeFilename,
  type AttachmentContentType,
} from "@/lib/attachments";
import { assertUploadedObject } from "@/lib/r2";
import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";

export type AttachmentMetaInput = {
  objectKey: string;
  filename: string;
  contentType: AttachmentContentType;
  byteSize: number;
};

export type PersistedAttachment = {
  id: string;
  filename: string;
  contentType: string;
  byteSize: number;
  kind: "image" | "video";
  createdAt: Date;
  commentId: string | null;
  authorId: string;
};

type AttachmentDb = Pick<PrismaClient, "attachment">;

export async function verifyOwnedUploads(
  boardId: string,
  cardId: string,
  items: AttachmentMetaInput[],
): Promise<AttachmentMetaInput[]> {
  const verified: AttachmentMetaInput[] = [];

  for (const item of items) {
    if (!isOwnedObjectKey(item.objectKey, boardId, cardId)) {
      throw new Error("VALIDATION");
    }

    const uploaded = await assertUploadedObject(
      item.objectKey,
      item.contentType,
    );

    verified.push({
      objectKey: item.objectKey,
      filename: sanitizeFilename(item.filename),
      contentType: item.contentType,
      byteSize: uploaded.byteSize,
    });
  }

  return verified;
}

export async function persistVerifiedAttachments(input: {
  boardId: string;
  cardId: string;
  commentId: string | null;
  authorId: string;
  items: AttachmentMetaInput[];
  db?: AttachmentDb;
}): Promise<PersistedAttachment[]> {
  if (input.items.length === 0) {
    return [];
  }

  const db = input.db ?? prisma;
  return db.attachment.createManyAndReturn({
    data: input.items.map((item) => ({
      boardId: input.boardId,
      cardId: input.cardId,
      commentId: input.commentId,
      authorId: input.authorId,
      objectKey: item.objectKey,
      filename: item.filename,
      contentType: item.contentType,
      byteSize: item.byteSize,
      kind: attachmentKindFor(item.contentType),
    })),
    select: {
      id: true,
      filename: true,
      contentType: true,
      byteSize: true,
      kind: true,
      createdAt: true,
      commentId: true,
      authorId: true,
    },
  });
}
