"use client";

import { useState } from "react";
import {
  createBoardLabel,
  deleteBoardLabel,
  renameBoardLabel,
  setBoardLabelColor,
} from "@/components/board-label-commands";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LabelColorPicker } from "@/components/label-color-picker";
import {
  DeleteActionIcon,
  PlusActionIcon,
} from "@/components/thread-action-icons";
import { useI18n } from "@/i18n/provider";
import { MAX_BOARD_LABELS, MAX_LABEL_NAME_LENGTH } from "@/lib/constants";
import {
  namesMatch,
  nextLabelColor,
  normalizeLabelName,
  sortBoardLabels,
  type BoardLabelView,
  type LabelCatalogChange,
  type LabelColorKey,
} from "@/lib/labels";

type BoardLabelManagerProps = {
  boardId: string;
  labels: readonly BoardLabelView[];
  onLabelsChange: LabelCatalogChange;
  onError: (error: string) => void;
};

export function BoardLabelManager({
  boardId,
  labels,
  onLabelsChange,
  onError,
}: BoardLabelManagerProps) {
  const { t } = useI18n();
  const suggestedColor = nextLabelColor(labels.map((label) => label.color));
  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState(suggestedColor);
  const [colorSource, setColorSource] = useState(labels);
  const [pendingDelete, setPendingDelete] = useState<BoardLabelView | null>(
    null,
  );
  const catalog = sortBoardLabels(labels);
  const canCreate = labels.length < MAX_BOARD_LABELS;

  if (labels !== colorSource) {
    setColorSource(labels);
    setDraftColor(suggestedColor);
  }

  return (
    <>
      <ul className="board-label-list" aria-label={t.board.labelsAria}>
        {catalog.map((label) => (
          <ManageLabelRow
            key={label.id}
            boardId={boardId}
            label={label}
            onLabelsChange={onLabelsChange}
            onError={onError}
            onAskDelete={() => setPendingDelete(label)}
          />
        ))}
        {canCreate ? (
          <CreateLabelRow
            color={draftColor}
            value={draftName}
            onColorChange={setDraftColor}
            onChange={setDraftName}
            onSubmit={() => {
              const name = normalizeLabelName(draftName);
              if (labels.some((label) => namesMatch(label.name, name))) {
                onError(t.errors.labelExists);
                return;
              }
              void createBoardLabel(
                boardId,
                draftName,
                draftColor,
                onLabelsChange,
                setDraftName,
                onError,
              );
            }}
          />
        ) : null}
      </ul>
      <ConfirmDialog
        open={pendingDelete !== null}
        title={t.cardPage.labelDeleteConfirm.replace(
          "{name}",
          pendingDelete?.name ?? "",
        )}
        description={t.cardPage.labelDeleteConfirmHint}
        cancelLabel={t.cardPage.labelDeleteCancel}
        confirmLabel={t.cardPage.labelDeleteYes}
        icon={<DeleteActionIcon size={20} />}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) {
            return;
          }
          const target = pendingDelete;
          setPendingDelete(null);
          void deleteBoardLabel(boardId, target, onLabelsChange, onError);
        }}
      />
    </>
  );
}

function ManageLabelRow({
  boardId,
  label,
  onLabelsChange,
  onError,
  onAskDelete,
}: {
  boardId: string;
  label: BoardLabelView;
  onLabelsChange: LabelCatalogChange;
  onError: (error: string) => void;
  onAskDelete: () => void;
}) {
  const { t } = useI18n();
  const [draftName, setDraftName] = useState(label.name);
  const [nameSource, setNameSource] = useState(label.name);

  if (label.name !== nameSource) {
    setNameSource(label.name);
    setDraftName(label.name);
  }

  return (
    <li className="board-label-edit">
      <div className="board-label-edit-head">
        <LabelColorPicker
          value={label.color}
          name={label.name}
          onChange={(color) => {
            void setBoardLabelColor(
              boardId,
              label,
              color,
              onLabelsChange,
              onError,
            );
          }}
        />
        <input
          className="board-label-name"
          data-color={label.color}
          value={draftName}
          maxLength={MAX_LABEL_NAME_LENGTH}
          aria-label={t.board.labelRenameAria.replace("{name}", label.name)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => {
            setDraftName(event.target.value.replace(/[\r\n]/g, ""));
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
          onBlur={() => {
            void renameBoardLabel(
              boardId,
              label,
              draftName,
              onLabelsChange,
              onError,
              setDraftName,
            );
          }}
        />
        <button
          type="button"
          className="card-label-remove"
          aria-label={t.cardPage.labelDeleteAria.replace("{name}", label.name)}
          onClick={onAskDelete}
        >
          <DeleteActionIcon size={14} />
        </button>
      </div>
    </li>
  );
}

function CreateLabelRow({
  color,
  value,
  onColorChange,
  onChange,
  onSubmit,
}: {
  color: LabelColorKey;
  value: string;
  onColorChange: (color: LabelColorKey) => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const { t } = useI18n();
  return (
    <li className="board-label-edit is-create">
      <div className="board-label-edit-head">
        <LabelColorPicker
          value={color}
          name={t.cardPage.labelCreatePlaceholder}
          onChange={onColorChange}
        />
        <input
          className="board-label-name"
          data-color={color}
          value={value}
          maxLength={MAX_LABEL_NAME_LENGTH}
          placeholder={t.cardPage.labelCreatePlaceholder}
          aria-label={t.cardPage.labelCreateAria}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => {
            onChange(event.target.value.replace(/[\r\n]/g, ""));
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmit();
            }
          }}
        />
        <button
          type="button"
          className="board-label-add"
          aria-label={t.cardPage.labelCreateAria}
          disabled={!value.trim()}
          onClick={onSubmit}
        >
          <PlusActionIcon size={14} />
        </button>
      </div>
    </li>
  );
}
