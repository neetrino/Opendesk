"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { BoardLabelManager } from "@/components/board-label-manager";
import { CardLabelIcon } from "@/components/card-label-icon";
import { useI18n } from "@/i18n/provider";
import type { BoardLabelView, LabelCatalogChange } from "@/lib/labels";

export type BoardLabelsControlValue = {
  boardId: string;
  labels: readonly BoardLabelView[];
  applyBoardLabels: LabelCatalogChange;
  onError: (error: string) => void;
};

const BoardLabelsSetterContext = createContext<
  ((control: BoardLabelsControlValue | null) => void) | null
>(null);

const BoardLabelsValueContext = createContext<BoardLabelsControlValue | null>(
  null,
);

export function BoardLabelsControlProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [control, setControl] = useState<BoardLabelsControlValue | null>(null);

  return (
    <BoardLabelsSetterContext.Provider value={setControl}>
      <BoardLabelsValueContext.Provider value={control}>
        {children}
      </BoardLabelsValueContext.Provider>
    </BoardLabelsSetterContext.Provider>
  );
}

export function useRegisterBoardLabelsControl(
  boardId: string,
  labels: readonly BoardLabelView[],
  applyBoardLabels: LabelCatalogChange,
  onError: (error: string) => void,
): void {
  const setControl = useContext(BoardLabelsSetterContext);

  useLayoutEffect(() => {
    if (!setControl) {
      return;
    }
    setControl({ boardId, labels, applyBoardLabels, onError });
  }, [boardId, labels, applyBoardLabels, onError, setControl]);

  useEffect(() => {
    return () => {
      setControl?.(null);
    };
  }, [setControl]);
}

export function BoardLabelsHeaderButton({
  boardId,
  labels,
}: {
  boardId: string;
  labels: readonly BoardLabelView[];
}) {
  const live = useContext(BoardLabelsValueContext);

  return (
    <BoardLabelsSheet
      boardId={live?.boardId ?? boardId}
      labels={live?.labels ?? labels}
      onLabelsChange={live?.applyBoardLabels ?? noopApply}
      onError={live?.onError ?? noopError}
    />
  );
}

export function BoardLabelsSettingsSection() {
  const { t } = useI18n();
  const live = useContext(BoardLabelsValueContext);
  if (!live) {
    return null;
  }

  return (
    <div className="sheet-block">
      <h3 className="settings-section-title">{t.board.labels}</h3>
      <BoardLabelManager
        boardId={live.boardId}
        labels={live.labels}
        onLabelsChange={live.applyBoardLabels}
        onError={live.onError}
      />
    </div>
  );
}

function BoardLabelsSheet({
  boardId,
  labels,
  onLabelsChange,
  onError,
}: {
  boardId: string;
  labels: readonly BoardLabelView[];
  onLabelsChange: LabelCatalogChange;
  onError: (error: string) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        if (document.querySelector(".confirm-dialog-root")) {
          return;
        }
        if (document.querySelector(".label-color-picker")) {
          return;
        }
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
        className="board-labels-btn"
        aria-label={t.board.labelsAria}
        title={t.board.labelsAria}
        onClick={() => setOpen(true)}
      >
        <CardLabelIcon size={16} />
        <span>{t.board.labels}</span>
      </button>
      {open
        ? createPortal(
            <div className="sheet-root" role="presentation">
              <button
                type="button"
                className="sheet-backdrop"
                aria-label={t.board.closeLabels}
                onClick={() => setOpen(false)}
              />
              <aside
                className="card-sheet participants-sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby="board-labels-title"
              >
                <div className="sheet-handle" aria-hidden="true" />
                <header className="sheet-header">
                  <h2
                    id="board-labels-title"
                    className="participants-sheet-title"
                  >
                    {t.board.labels}
                  </h2>
                  <button
                    type="button"
                    className="sheet-icon-btn"
                    aria-label={t.board.closeLabels}
                    onClick={() => setOpen(false)}
                  >
                    ×
                  </button>
                </header>
                <div className="sheet-body">
                  <div className="sheet-details">
                    <div className="sheet-block">
                      <BoardLabelManager
                        boardId={boardId}
                        labels={labels}
                        onLabelsChange={onLabelsChange}
                        onError={onError}
                      />
                    </div>
                  </div>
                </div>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function noopApply(): void {
  return undefined;
}

function noopError(): void {
  return undefined;
}
