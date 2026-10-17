"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BoardSettingsSections } from "@/components/board-settings-sections";
import { SettingsIcon } from "@/components/settings-icon";
import { useI18n } from "@/i18n/provider";

type BoardSettingsMenuProps = {
  boardId: string;
};

export function BoardSettingsMenu({ boardId }: BoardSettingsMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !document.querySelector(".confirm-dialog-root")) {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="board-settings-btn"
        aria-label={t.board.settingsAria}
        title={t.board.settings}
        onClick={() => setOpen(true)}
      >
        <SettingsIcon size={18} />
      </button>
      {open ? (
        <SettingsSheet boardId={boardId} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function SettingsSheet({
  boardId,
  onClose,
}: {
  boardId: string;
  onClose: () => void;
}) {
  const { t } = useI18n();

  return createPortal(
    <div className="sheet-root" role="presentation">
      <button
        type="button"
        className="sheet-backdrop"
        aria-label={t.board.closeSettings}
        onClick={onClose}
      />
      <aside
        className="card-sheet settings-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-settings-menu-title"
      >
        <div className="sheet-handle" aria-hidden="true" />
        <header className="sheet-header">
          <h2 id="board-settings-menu-title" className="participants-sheet-title">
            {t.board.settings}
          </h2>
          <button
            type="button"
            className="sheet-icon-btn"
            aria-label={t.board.closeSettings}
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="sheet-body">
          <div className="sheet-details">
            <BoardSettingsSections boardId={boardId} isOwner />
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
