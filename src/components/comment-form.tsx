"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type MouseEvent,
} from "react";
import { CameraCaptureOverlay } from "@/components/camera-capture-overlay";
import {
  MediaCaptureControls,
  VoiceMicIcon,
} from "@/components/media-capture-controls";
import { SendIcon } from "@/components/send-icon";
import { VoiceNotePlayer } from "@/components/voice-note-player";
import {
  CommentMentionPicker,
  mentionQueryAtCaret,
} from "@/components/comment-mention-picker";
import { addCommentAction } from "@/lib/actions";
import type { ThreadReplyTo } from "@/lib/card-comment-view";
import type { MentionParticipant } from "@/lib/comment-mentions";
import { applyAttachmentLimitCopy, attachmentKindFor } from "@/lib/attachments";
import { MAX_COMMENT_ATTACHMENTS, MAX_COMMENT_LENGTH } from "@/lib/constants";
import {
  isLocalCardId,
  OPTIMISTIC_COMMENT_ID_PREFIX,
  type BoardAttachment,
  type OptimisticCommentAttachment,
} from "@/lib/local-cards";
import {
  requestAndUploadFile,
  validateLocalFile,
} from "@/lib/upload-client";
import { useCameraCapture } from "@/lib/use-camera-capture";
import { useComposerPrimaryAction } from "@/lib/use-composer-primary-action";
import { useVoiceRecorder } from "@/lib/use-voice-recorder";
import { formatVoiceElapsed } from "@/lib/voice-recorder";
import { useI18n } from "@/i18n/provider";

export type { OptimisticCommentAttachment };

const COMPOSER_MAX_HEIGHT_PX = 168;
const COMPOSER_EXPAND_AFTER_PX = 52;

type PendingCommentFile = {
  localId: string;
  file: File;
  previewUrl: string;
  kind: BoardAttachment["kind"];
};

function syncFieldExpanded(
  textarea: HTMLTextAreaElement,
  contentHeight: number,
): void {
  const field = textarea.closest(".comment-compose-field");
  if (field instanceof HTMLElement) {
    field.classList.toggle(
      "is-expanded",
      contentHeight > COMPOSER_EXPAND_AFTER_PX,
    );
  }
}

function fitTextarea(textarea: HTMLTextAreaElement): void {
  textarea.style.overflowY = "hidden";
  textarea.style.height = "auto";
  const contentHeight = textarea.scrollHeight;
  syncFieldExpanded(textarea, contentHeight);
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
  participants: MentionParticipant[];
  replyTo: ThreadReplyTo | null;
  onCancelReply: () => void;
  onOptimisticSend: (
    body: string,
    tempId: string,
    attachments: OptimisticCommentAttachment[],
    replyTo: ThreadReplyTo | null,
  ) => void;
  onOptimisticConfirm: (tempId: string, commentId: string) => void;
  onOptimisticRollback: (tempId: string) => void;
};

function mapFileError(
  message: string,
  errors: {
    fileTooLarge: string;
    fileTypeUnsupported: string;
    uploadFailed: string;
    microphoneDenied: string;
    voiceUnsupported: string;
  },
): string {
  if (message === "fileTooLarge") {
    return applyAttachmentLimitCopy(errors.fileTooLarge);
  }
  if (message === "fileTypeUnsupported") {
    return errors.fileTypeUnsupported;
  }
  if (message === "UPLOAD_FAILED") {
    return errors.uploadFailed;
  }
  if (message === "microphoneDenied") {
    return errors.microphoneDenied;
  }
  if (message === "voiceUnsupported") {
    return errors.voiceUnsupported;
  }
  return message;
}

export function CommentForm({
  boardId,
  cardId,
  enabled,
  participants,
  replyTo,
  onCancelReply,
  onOptimisticSend,
  onOptimisticConfirm,
  onOptimisticRollback,
}: CommentFormProps) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [hasText, setHasText] = useState(false);
  const [mention, setMention] = useState<{ start: number; query: string } | null>(
    null,
  );
  const [pendingFiles, setPendingFiles] = useState<PendingCommentFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const locked = isLocalCardId(cardId);
  const canAttach = enabled && !locked;
  const canSend = hasText || pendingFiles.length > 0;
  const { primaryAction, rememberPrimary } = useComposerPrimaryAction();

  const { recording, elapsedMs, start, stop, cancel } = useVoiceRecorder({
    onError: (key) => setError(mapFileError(key, t.errors)),
    onAutoStop: (file) => addFiles([file]),
  });
  const camera = useCameraCapture({
    onAutoStopVideo: (file) => addFiles([file]),
  });

  useLayoutEffect(() => {
    if (textareaRef.current) {
      fitTextarea(textareaRef.current);
      setHasText(textareaRef.current.value.trim().length > 0);
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
        kind: attachmentKindFor(local.contentType),
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

  function sendComment(body: string, files: PendingCommentFile[]): void {
    if (locked || (body.length === 0 && files.length === 0)) {
      return;
    }

    const textarea = textareaRef.current;
    const tempId = `${OPTIMISTIC_COMMENT_ID_PREFIX}${crypto.randomUUID()}`;
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
    const reply = replyTo;

    if (textarea) {
      textarea.value = "";
      fitTextarea(textarea);
    }
    setHasText(false);
    setPendingFiles([]);
    setError(null);
    onOptimisticSend(body, tempId, optimisticAttachments, reply);
    void persistComment(body, files, tempId, reply, textarea);
  }

  async function persistComment(
    body: string,
    files: PendingCommentFile[],
    tempId: string,
    reply: ThreadReplyTo | null,
    textarea: HTMLTextAreaElement | null,
  ): Promise<void> {
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
      if (reply) {
        formData.set("parentId", reply.id);
      }
      formData.set("attachments", JSON.stringify(uploaded));
      const response = await addCommentAction(formData);
      if (!response.ok) {
        throw new Error(response.error);
      }
      onOptimisticConfirm(tempId, response.data.commentId);
      onCancelReply();
    } catch (caught) {
      onOptimisticRollback(tempId);
      const message =
        caught instanceof Error ? caught.message : t.errors.addComment;
      setError(mapFileError(message, t.errors));
      if (textarea) {
        textarea.value = body;
        fitTextarea(textarea);
      }
      setHasText(body.length > 0);
      setPendingFiles(files);
      textarea?.focus();
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (recording || locked) {
      return;
    }
    const body = textareaRef.current?.value.trim() ?? "";
    sendComment(body, pendingFiles);
  }

  async function finishVoiceAndSend(): Promise<void> {
    const file = await stop();
    if (!file) {
      return;
    }
    const local = validateLocalFile(file);
    if ("errorKey" in local) {
      setError(mapFileError(local.errorKey, t.errors));
      return;
    }
    const pending: PendingCommentFile = {
      localId: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      kind: attachmentKindFor(local.contentType),
    };
    const body = textareaRef.current?.value.trim() ?? "";
    sendComment(body, [...pendingFiles, pending]);
  }

  function startVoice(): void {
    if (!canAttach) {
      return;
    }
    rememberPrimary("voice");
    setError(null);
    void start();
  }

  function openCamera(): void {
    if (!canAttach || recording) {
      return;
    }
    rememberPrimary("camera");
    setError(null);
    void camera.open();
  }

  function onCameraFiles(files: File[]): void {
    camera.close();
    addFiles(files);
  }

  function onPrimaryClick(event: MouseEvent<HTMLButtonElement>): void {
    if (recording) {
      event.preventDefault();
      void finishVoiceAndSend();
      return;
    }
    if (canSend) {
      return;
    }
    event.preventDefault();
    startVoice();
  }

  const unavailableReason = !enabled
    ? t.cardPage.attachmentsUnavailable
    : locked
      ? t.cardPage.attachmentsLocalCard
      : undefined;
  const showSend = recording || canSend;
  const captureLabels = {
    camera: applyAttachmentLimitCopy(t.comment.captureCamera),
    cameraAria: t.comment.captureCameraAria,
    file: t.comment.captureFile,
    fileAria: t.comment.captureFileAria,
  };

  return (
    <form
      id={`comment-form-${cardId}`}
      onSubmit={onSubmit}
      className={recording ? "comment-form is-recording" : "comment-form"}
    >
      {replyTo ? (
        <div className="comment-reply-bar">
          <span>
            {t.cardPage.replyTo.replace("{name}", replyTo.authorName)}
            {replyTo.excerpt ? `: ${replyTo.excerpt}` : ""}
          </span>
          <button type="button" onClick={onCancelReply} aria-label={t.cardPage.cancelReply}>
            ×
          </button>
        </div>
      ) : null}
      {mention ? (
        <CommentMentionPicker
          participants={participants}
          query={mention.query}
          onPick={(participant) => {
            const textarea = textareaRef.current;
            if (!textarea) {
              return;
            }
            const before = textarea.value.slice(0, mention.start);
            const after = textarea.value.slice(textarea.selectionStart);
            textarea.value = `${before}@${participant.displayName} ${after}`;
            fitTextarea(textarea);
            setHasText(textarea.value.trim().length > 0);
            setMention(null);
            textarea.focus();
          }}
        />
      ) : null}
      {pendingFiles.length > 0 ? (
        <ul className="comment-previews">
          {pendingFiles.map((item) => (
            <li
              key={item.localId}
              className={
                item.kind === "audio"
                  ? "comment-preview is-audio"
                  : "comment-preview"
              }
            >
              {item.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.previewUrl} alt="" />
              ) : item.kind === "video" ? (
                <video src={item.previewUrl} muted playsInline />
              ) : (
                <VoiceNotePlayer
                  src={item.previewUrl}
                  filename={item.file.name}
                />
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
      <div className="comment-compose-row">
        <div className="comment-compose-field">
          {recording ? (
            <div className="voice-recording" aria-live="polite">
              <button
                type="button"
                className="comment-attach voice-cancel"
                onClick={cancel}
                aria-label={t.comment.cancelRecording}
                title={t.comment.cancelRecording}
              >
                ×
              </button>
              <span className="voice-recording-dot" aria-hidden="true" />
              <span className="voice-recording-label">
                {t.comment.recordingVoice}
              </span>
              <span className="voice-recording-time">
                {formatVoiceElapsed(elapsedMs)}
              </span>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              name="body"
              rows={1}
              maxLength={MAX_COMMENT_LENGTH}
              placeholder={t.comment.placeholder}
              autoComplete="off"
              onPaste={onPaste}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              onInput={(event) => {
                fitTextarea(event.currentTarget);
                setHasText(event.currentTarget.value.trim().length > 0);
                setMention(
                  mentionQueryAtCaret(
                    event.currentTarget.value,
                    event.currentTarget.selectionStart,
                  ),
                );
              }}
            />
          )}
          {recording ? null : (
            <div className="comment-compose-secondary">
              {primaryAction === "camera" ? (
                <button
                  type="button"
                  className="comment-attach"
                  onClick={startVoice}
                  disabled={!canAttach}
                  aria-label={t.comment.recordVoiceAria}
                  title={unavailableReason ?? t.comment.recordVoice}
                >
                  <VoiceMicIcon size={20} />
                </button>
              ) : (
                <MediaCaptureControls
                  disabled={!canAttach}
                  onOpenCamera={openCamera}
                  onPickFiles={addFiles}
                  labels={captureLabels}
                  unavailableReason={unavailableReason}
                />
              )}
            </div>
          )}
        </div>
        {showSend || primaryAction === "voice" ? (
          <button
            className="comment-action"
            type={canSend && !recording ? "submit" : "button"}
            onClick={onPrimaryClick}
            disabled={locked || (!canAttach && !canSend)}
            aria-label={
              recording || canSend ? t.comment.send : t.comment.recordVoiceAria
            }
            title={
              recording || canSend
                ? t.comment.send
                : (unavailableReason ?? t.comment.recordVoice)
            }
          >
            {showSend ? <SendIcon size={20} /> : <VoiceMicIcon size={20} />}
          </button>
        ) : (
          <MediaCaptureControls
            appearance="action"
            disabled={!canAttach}
            onOpenCamera={openCamera}
            onPickFiles={addFiles}
            labels={captureLabels}
            unavailableReason={unavailableReason}
          />
        )}
      </div>
      <CameraCaptureOverlay
        open={camera.isOpen}
        stream={camera.stream}
        ready={camera.ready}
        errorKey={camera.errorKey}
        recording={camera.recording}
        elapsedMs={camera.elapsedMs}
        onClose={camera.close}
        onFiles={onCameraFiles}
        onFlip={() => {
          void camera.flip();
        }}
        onTakePhoto={camera.takePhoto}
        onStartVideo={camera.startVideo}
        onStopVideo={camera.stopVideo}
        labels={{
          close: t.comment.closeCamera,
          closeAria: t.comment.closeCameraAria,
          switchCamera: t.comment.switchCamera,
          switchCameraAria: t.comment.switchCameraAria,
          shutter: applyAttachmentLimitCopy(t.comment.cameraShutter),
          shutterAria: t.comment.cameraShutterAria,
          gallery: t.comment.captureGallery,
          galleryAria: t.comment.captureGalleryAria,
          recording: t.comment.recordingVideo,
          unavailable: t.comment.cameraUnavailable,
          fallbackPhoto: t.comment.cameraFallbackPhoto,
          fallbackVideo: t.comment.cameraFallbackVideo,
        }}
        errors={{
          cameraDenied: t.errors.cameraDenied,
          cameraUnsupported: t.errors.cameraUnsupported,
        }}
      />
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}
