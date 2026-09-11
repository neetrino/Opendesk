import { describe, expect, it } from "vitest";
import {
  applyAttachmentLimitCopy,
  attachmentKindFor,
  attachmentLimitFor,
  buildObjectKey,
  canPreviewInline,
  isOwnedObjectKey,
  resolveContentType,
  sanitizeFilename,
} from "@/lib/attachments";
import {
  MAX_CARD_ATTACHMENTS,
  MAX_CARD_COMMENT_ATTACHMENTS,
  MAX_COMMENT_ATTACHMENTS,
} from "@/lib/constants";
import { addCommentWithAttachmentsSchema } from "@/lib/validation";

const boardId = "clxxxxxxxxxxxxxxxxxxxxxxxxx";
const cardId = "clyyyyyyyyyyyyyyyyyyyyyyyyy";

describe("attachment helpers", () => {
  it("resolves jpeg from filename when type is empty", () => {
    expect(resolveContentType("", "site-photo.JPEG")).toBe("image/jpeg");
  });

  it("rejects unsupported types", () => {
    expect(resolveContentType("application/pdf", "notes.pdf")).toBeNull();
  });

  it("builds a key owned by the card", () => {
    const key = buildObjectKey(boardId, cardId, "video/mp4");
    expect(isOwnedObjectKey(key, boardId, cardId)).toBe(true);
    expect(isOwnedObjectKey(key, boardId, "clotherxxxxxxxxxxxxxxxxxxxx")).toBe(
      false,
    );
    expect(attachmentKindFor("video/mp4")).toBe("video");
    expect(attachmentKindFor("audio/webm")).toBe("audio");
    expect(resolveContentType("audio/webm;codecs=opus", "voice-note.webm")).toBe(
      "audio/webm",
    );
  });

  it("sanitizes path characters in filenames", () => {
    expect(sanitizeFilename(" folder/secret.png ")).toBe("folder_secret.png");
  });

  it("previews common images and mp4, not heic or mov", () => {
    expect(canPreviewInline("image/png", "image")).toBe(true);
    expect(canPreviewInline("image/heic", "image")).toBe(false);
    expect(canPreviewInline("video/mp4", "video")).toBe(true);
    expect(canPreviewInline("video/quicktime", "video")).toBe(false);
    expect(canPreviewInline("audio/webm", "audio")).toBe(true);
    expect(canPreviewInline("audio/mp4", "audio")).toBe(true);
  });

  it("keeps comment-thread quota independent of card-level and per-comment caps", () => {
    const card = attachmentLimitFor(cardId, "card");
    const comment = attachmentLimitFor(cardId, "comment");

    expect(card.where).toEqual({ cardId, commentId: null });
    expect(card.limit).toBe(MAX_CARD_ATTACHMENTS);
    expect(comment.where).toEqual({ cardId, commentId: { not: null } });
    expect(comment.limit).toBe(MAX_CARD_COMMENT_ATTACHMENTS);
    expect(comment.limit).toBeGreaterThan(MAX_COMMENT_ATTACHMENTS);
  });
});

describe("comment attachments schema", () => {
  it("allows a file-only comment", () => {
    const parsed = addCommentWithAttachmentsSchema.safeParse({
      boardId,
      cardId,
      body: "",
      attachments: [
        {
          objectKey: `opendesk/${boardId}/${cardId}/11111111-1111-4111-8111-111111111111.jpg`,
          filename: "photo.jpg",
          contentType: "image/jpeg",
          byteSize: 1200,
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects more than MAX_COMMENT_ATTACHMENTS on one comment", () => {
    const attachments = Array.from(
      { length: MAX_COMMENT_ATTACHMENTS + 1 },
      (_, index) => ({
        objectKey: `opendesk/${boardId}/${cardId}/11111111-1111-4111-8111-11111111111${index}.jpg`,
        filename: `photo-${index}.jpg`,
        contentType: "image/jpeg" as const,
        byteSize: 1200,
      }),
    );
    const parsed = addCommentWithAttachmentsSchema.safeParse({
      boardId,
      cardId,
      body: "",
      attachments,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an empty comment without files", () => {
    const parsed = addCommentWithAttachmentsSchema.safeParse({
      boardId,
      cardId,
      body: "   ",
      attachments: [],
    });
    expect(parsed.success).toBe(false);
  });

  it("fills size and duration placeholders in limit copy", () => {
    expect(
      applyAttachmentLimitCopy("Up to {n} MB, about {minutes} min"),
    ).toBe("Up to 200 MB, about 2 min");
  });
});
