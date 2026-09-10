"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type ClipboardEvent,
  type FormEvent,
} from "react";
import { PaperclipIcon } from "@/components/paperclip-icon";
import { addCommentAction } from "@/lib/actions";
import {
  ATTACHMENT_FILE_ACCEPT,
} from "@/lib/attachments";
import { MAX_COMMENT_ATTACHMENTS, MAX_COMMENT_LENGTH } from "@/lib/constants";
import { isLocalCardId } from "@/lib/local-cards";
import type { BoardAttachment } from "@/lib/local-cards";
import {
  requestAndUploadFile,
  validateLocalFile,
} from "@/lib/upload-client";
import { useI18n } from "@/i18n/provider";

export type OptimisticCommentAttachment = Pick<
  BoardAttachment,
  "id" | "filename" | "contentType" | "kind" | "byteSize"
> & {
  previewUrl?: string;
};

const COMPOSER_MAX_HEIGHT_PX = 200;

type PendingCommentFile = {
  localId: string;
  file: File;
  previewUrl: string;
  kind: "image" | "video";
};

function fitTextarea(textarea: HTMLTextAreaElement): void {
  textarea.style.overflowY = "hidden";
  textarea.style.height = "auto";
  const contentHeight = textarea.scrollHeight;
  if (contentHeight > COMPOSER_MAX_HEIGHT_PX) {
    textarea.style.height = `${COMPOSER_MAX_HEIGHT_PX}px`;
    textarea.style.overflowY = "auto";
    return;
  }
  textarea.style.height = `${contentHeight}px`;
}

type CommentFormProps = {
  boardId: string;
  cardId: string;
  enabled: boolean;
  onOptimisticSend: (
    body: string,
    tempId: string,
    attachments: OptimisticCommentAttachment[],
  ) => void;
  onOptimisticRollback: (tempId: string) => void;
};

function mapFileError(
  message: string,
  errors: {
    fileTooLarge: string;
    fileTypeUnsupported: string;
    uploadFailed: string;
  },
): string {
  if (message === "fileTooLarge") {
    return errors.fileTooLarge;
  }
  if (message === "fileTypeUnsupported") {
    return errors.fileTypeUnsupported;
  }
  if (message === "UPLOAD_FAILED") {
    return errors.uploadFailed;
  }
  return message;
}

export function CommentForm({
  boardId,
  cardId,
  enabled,
  onOptimisticSend,
  onOptimisticRollback,
}: CommentFormProps) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingCommentFile[]>([]);
  const [, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const locked = isLocalCardId(cardId);
  const canAttach = enabled && !locked;

  useLayoutEffect(() => {
    if (textareaRef.current) {
      fitTextarea(textareaRef.current);
    }
  }, [cardId]);

  function addFiles(files: File[]): void {
    const remaining = MAX_COMMENT_ATTACHMENTS - pendingFiles.length;
    if (remaining <= 0) {
      setError(t.errors.attachmentLimit);
      return;
    }

    const accepted: PendingCommentFile[] = [];
    for (const file of files.slice(0, remaining)) {
      const local = validateLocalFile(file);
      if ("errorKey" in local) {
        setError(mapFileError(local.errorKey, t.errors));
        continue;
      }
      accepted.push({
        localId: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        kind: local.contentType.startsWith("video/") ? "video" : "image",
      });
    }

    if (accepted.length > 0) {
      setPendingFiles((current) => [...current, ...accepted]);
    }
  }

  function removeFile(localId: string): void {
    setPendingFiles((current) => {
      const target = current.find((item) => item.localId === localId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.localId !== localId);
    });
  }

  function onPaste(event: ClipboardEvent<HTMLTextAreaElement>): void {
    const files = Array.from(event.clipboardData.files);
    if (files.length === 0 || !canAttach) {
      return;
    }
    event.preventDefault();
    addFiles(files);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const body = textarea.value.trim();
    const files = pendingFiles;
    if (body.length === 0 && files.length === 0) {
      return;
    }

    const tempId = `optimistic-${crypto.randomUUID()}`;
    const optimisticAttachments: OptimisticCommentAttachment[] = files.map(
      (item) => ({
        id: item.localId,
        filename: item.file.name,
        contentType: item.file.type,
        kind: item.kind,
        byteSize: item.file.size,
        previewUrl: item.previewUrl,
      }),
    );

    textarea.value = "";
    fitTextarea(textarea);
    setPendingFiles([]);
    setError(null);

    startTransition(async () => {
      onOptimisticSend(body, tempId, optimisticAttachments);
      try {
        const uploaded = [];
        for (const item of files) {
          uploaded.push(
            await requestAndUploadFile({
              boardId,
              cardId,
              file: item.file,
              target: "comment",
            }),
          );
        }

        const formData = new FormData();
        formData.set("boardId", boardId);
        formData.set("cardId", cardId);
        formData.set("body", body);
        formData.set("attachments", JSON.stringify(uploaded));
        const response = await addCommentAction(formData);
        if (!response.ok) {
          throw new Error(response.error);
        }
      } catch (caught) {
        onOptimisticRollback(tempId);
        const message =
          caught instanceof Error ? caught.message : t.errors.addComment;
        setError(mapFileError(message, t.errors));
        textarea.value = body;
        fitTextarea(textarea);
        setPendingFiles(files);
        textarea.focus();
      }
    });
  }

  return (
    <form
      id={`comment-form-${cardId}`}
      onSubmit={onSubmit}
      className="comment-form"
    >
      {pendingFiles.length > 0 ? (
        <ul className="comment-previews">
          {pendingFiles.map((item) => (
            <li key={item.localId} className="comment-preview">
              {item.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.previewUrl} alt="" />
              ) : (
                <video src={item.previewUrl} muted playsInline />
              )}
              <button
                type="button"
                className="media-thumb-remove"
                onClick={() => removeFile(item.localId)}
                aria-label={t.cardPage.attachmentRemove}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <textarea
        ref={textareaRef}
        name="body"
        rows={2}
        maxLength={MAX_COMMENT_LENGTH}
        placeholder={t.comment.placeholder}
        autoComplete="off"
        onPaste={onPaste}
        onInput={(event) => fitTextarea(event.currentTarget)}
      />
      {error ? <p className="form-error">{error}</p> : null}
      <div className="comment-toolbar">
        <input
          ref={inputRef}
          type="file"
          accept={ATTACHMENT_FILE_ACCEPT}
          multiple
          hidden
          disabled={!canAttach}
          onChange={(event) => {
            const files = event.target.files ? Array.from(event.target.files) : [];
            event.target.value = "";
            addFiles(files);
          }}
        />
        <button
          type="button"
          className="sheet-icon-btn comment-attach"
          onClick={() => inputRef.current?.click()}
          disabled={!canAttach}
          aria-label={t.comment.attachAria}
          title={
            !enabled
              ? t.cardPage.attachmentsUnavailable
              : locked
                ? t.cardPage.attachmentsLocalCard
                : t.comment.attach
          }
        >
          <PaperclipIcon size={17} />
        </button>
        <button className="button" type="submit">
          {t.comment.send}
        </button>
      </div>
    </form>
  );
}
