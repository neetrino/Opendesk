import {
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_FILENAME_LENGTH,
  MAX_CARD_ATTACHMENTS,
  MAX_COMMENT_ATTACHMENTS,
} from "@/lib/constants";

export const ATTACHMENT_OBJECT_PREFIX = "opendesk";

export const ATTACHMENT_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export type AttachmentContentType = (typeof ATTACHMENT_CONTENT_TYPES)[number];
export type AttachmentKind = "image" | "video";
export type AttachmentUploadTarget = "card" | "comment";

const CONTENT_TYPE_TO_KIND: Record<AttachmentContentType, AttachmentKind> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/gif": "image",
  "image/heic": "image",
  "image/heif": "image",
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
};

const CONTENT_TYPE_TO_EXT: Record<AttachmentContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

const EXT_TO_CONTENT_TYPE: Record<string, AttachmentContentType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

const OBJECT_KEY_PATTERN = new RegExp(
  `^${ATTACHMENT_OBJECT_PREFIX}/[a-z0-9]+/[a-z0-9]+/[0-9a-f-]{36}\\.(${Object.values(CONTENT_TYPE_TO_EXT).join("|")})$`,
);

export function isAllowedContentType(
  value: string,
): value is AttachmentContentType {
  return (ATTACHMENT_CONTENT_TYPES as readonly string[]).includes(value);
}

export function attachmentKindFor(
  contentType: AttachmentContentType,
): AttachmentKind {
  return CONTENT_TYPE_TO_KIND[contentType];
}

export function resolveContentType(
  declaredType: string,
  filename: string,
): AttachmentContentType | null {
  const normalized = declaredType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (isAllowedContentType(normalized)) {
    return normalized;
  }

  const ext = filename.split(".").pop()?.trim().toLowerCase() ?? "";
  return EXT_TO_CONTENT_TYPE[ext] ?? null;
}

export function sanitizeFilename(filename: string): string {
  const trimmed = filename.trim().replace(/[/\\]/g, "_");
  const base = trimmed.length > 0 ? trimmed : "file";
  return base.slice(0, MAX_ATTACHMENT_FILENAME_LENGTH);
}

export function buildObjectKey(
  boardId: string,
  cardId: string,
  contentType: AttachmentContentType,
): string {
  const ext = CONTENT_TYPE_TO_EXT[contentType];
  return `${ATTACHMENT_OBJECT_PREFIX}/${boardId}/${cardId}/${crypto.randomUUID()}.${ext}`;
}

export function isOwnedObjectKey(
  objectKey: string,
  boardId: string,
  cardId: string,
): boolean {
  return (
    OBJECT_KEY_PATTERN.test(objectKey) &&
    objectKey.startsWith(`${ATTACHMENT_OBJECT_PREFIX}/${boardId}/${cardId}/`)
  );
}

export function canPreviewInline(
  contentType: string,
  kind: AttachmentKind,
): boolean {
  if (kind === "video") {
    return contentType === "video/mp4" || contentType === "video/webm";
  }
  return (
    contentType === "image/jpeg" ||
    contentType === "image/png" ||
    contentType === "image/webp" ||
    contentType === "image/gif"
  );
}

export function attachmentPublicPath(id: string): string {
  return `/api/attachments/${id}`;
}

export const ATTACHMENT_PUBLIC_SELECT = {
  id: true,
  filename: true,
  contentType: true,
  byteSize: true,
  kind: true,
  createdAt: true,
  commentId: true,
  authorId: true,
} as const;

export const ATTACHMENT_FILE_ACCEPT = [
  ...ATTACHMENT_CONTENT_TYPES,
  "image/*",
  "video/*",
].join(",");

export function isWithinAttachmentSize(byteSize: number): boolean {
  return Number.isInteger(byteSize) && byteSize > 0 && byteSize <= MAX_ATTACHMENT_BYTES;
}

/**
 * Card-level and comment-level attachment quotas are independent.
 * Comment uploads must not count files with `commentId: null`.
 */
export function attachmentLimitFor(
  cardId: string,
  target: AttachmentUploadTarget,
): {
  where:
    | { cardId: string; commentId: null }
    | { cardId: string; commentId: { not: null } };
  limit: number;
} {
  if (target === "card") {
    return {
      where: { cardId, commentId: null },
      limit: MAX_CARD_ATTACHMENTS,
    };
  }
  return {
    where: { cardId, commentId: { not: null } },
    limit: MAX_COMMENT_ATTACHMENTS,
  };
}
