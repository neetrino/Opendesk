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
      const file = await fetchExport(boardId);
      if (!file) {
        setMessage(t.board.exportFailed);
        return;
      }
      downloadMarkdown(file.filename, file.text);
      setMessage(t.board.exportDownloaded);
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
        className="button"
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

async function fetchExport(
  boardId: string,
): Promise<{ text: string; filename: string } | null> {
  const response = await fetch(`/api/boards/${boardId}/export`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    return null;
  }
  const text = await response.text();
  return { text, filename: filenameFromDisposition(response.headers) };
}

function filenameFromDisposition(headers: Headers): string {
  const header = headers.get("Content-Disposition") ?? "";
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header)?.[1];
  if (!encoded) {
    return "opendesk-board.md";
  }
  try {
    return decodeURIComponent(encoded);
  } catch {
    return "opendesk-board.md";
  }
}

function downloadMarkdown(filename: string, text: string): void {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/markdown;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
