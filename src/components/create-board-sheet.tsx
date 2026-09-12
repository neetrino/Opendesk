"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CreateBoardForm } from "@/components/create-board-form";
import { useI18n } from "@/i18n/provider";

type CreateBoardSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateBoardSheet({ open, onClose }: CreateBoardSheetProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="sheet-root" role="presentation">
      <button
        type="button"
        className="sheet-backdrop"
        aria-label={t.boardsPage.closeCreate}
        onClick={onClose}
      />
      <aside
        className="card-sheet create-board-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-board-sheet-title"
      >
        <div className="sheet-handle" aria-hidden="true" />
        <header className="sheet-header">
          <h2 id="create-board-sheet-title" className="participants-sheet-title">
            {t.boardForm.create}
          </h2>
          <button
            type="button"
            className="sheet-icon-btn"
            aria-label={t.boardsPage.closeCreate}
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="sheet-body">
          <CreateBoardForm />
        </div>
      </aside>
    </div>,
    document.body,
  );
}
