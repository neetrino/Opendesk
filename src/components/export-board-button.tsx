"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/i18n/provider";

type ExportBoardButtonProps = {
  boardId: string;
};

export function ExportBoardButton({ boardId }: ExportBoardButtonProps) {
  const { t } = useI18n();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const messageTimer = useRef<number | null>(null);

  async function onExport(): Promise<void> {
    if (pending) {
      return;
    }
    setPending(true);
    setMessage(null);
    try {
      const text = await fetchExport(boardId);
      if (!text) {
        setMessage(t.board.exportFailed);
        return;
      }
      setMessage(await copyOrDownload(text, boardId, t.board));
    } catch {
      setMessage(t.board.exportFailed);
    } finally {
      setPending(false);
      if (messageTimer.current !== null) {
        window.clearTimeout(messageTimer.current);
      }
      messageTimer.current = window.setTimeout(() => setMessage(null), 4000);
    }
  }

  const label = pending
    ? t.board.exporting
    : (message ?? t.board.exportForAgent);

  return (
    <div className="invite-actions">
      <button
        type="button"
        className="button button-secondary"
        disabled={pending}
        onClick={() => {
          void onExport();
        }}
      >
        {label}
      </button>
      <p className="muted invite-hint">{message ?? t.board.exportForAgentHint}</p>
    </div>
  );
}

async function fetchExport(boardId: string): Promise<string | null> {
  const response = await fetch(`/api/boards/${boardId}/export`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    return null;
  }
  return response.text();
}

async function copyOrDownload(
  text: string,
  boardId: string,
  labels: {
    exportCopied: string;
    exportDownloaded: string;
  },
): Promise<string> {
  try {
    await navigator.clipboard.writeText(text);
    return labels.exportCopied;
  } catch {
    downloadMarkdown(`opendesk-${boardId}.md`, text);
    return labels.exportDownloaded;
  }
}

function downloadMarkdown(filename: string, text: string): void {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/markdown;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
