"use client";

import { createAttachmentUploadAction } from "@/lib/attachment-actions";
import { MAX_ATTACHMENT_BYTES } from "@/lib/constants";
import {
  resolveContentType,
  type AttachmentKind,
} from "@/lib/attachments";

export type PendingUpload = {
  objectKey: string;
  filename: string;
  contentType: string;
  byteSize: number;
  kind: AttachmentKind;
};

function putFile(
  uploadUrl: string,
  file: File,
  contentType: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error("UPLOAD_FAILED"));
    };
    xhr.onerror = () => reject(new Error("UPLOAD_FAILED"));
    xhr.send(file);
  });
}

export function validateLocalFile(file: File): {
  contentType: NonNullable<ReturnType<typeof resolveContentType>>;
} | { errorKey: "fileTooLarge" | "fileTypeUnsupported" } {
  if (file.size > MAX_ATTACHMENT_BYTES || file.size <= 0) {
    return { errorKey: "fileTooLarge" };
  }
  const contentType = resolveContentType(file.type, file.name);
  if (!contentType) {
    return { errorKey: "fileTypeUnsupported" };
  }
  return { contentType };
}

export async function requestAndUploadFile(input: {
  boardId: string;
  cardId: string;
  file: File;
  target: "card" | "comment";
  onProgress?: (percent: number) => void;
}): Promise<PendingUpload> {
  const local = validateLocalFile(input.file);
  if ("errorKey" in local) {
    throw new Error(local.errorKey);
  }

  const signed = await createAttachmentUploadAction({
    boardId: input.boardId,
    cardId: input.cardId,
    filename: input.file.name,
    contentType: local.contentType,
    byteSize: input.file.size,
    target: input.target,
  });

  if (!signed.ok) {
    throw new Error(signed.error);
  }

  await putFile(
    signed.data.uploadUrl,
    input.file,
    signed.data.contentType,
    input.onProgress,
  );

  return {
    objectKey: signed.data.objectKey,
    filename: signed.data.filename,
    contentType: signed.data.contentType,
    byteSize: input.file.size,
    kind: signed.data.kind,
  };
}
