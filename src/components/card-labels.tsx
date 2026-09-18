"use client";

import { useState } from "react";
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { CardLabelIcon } from "@/components/card-label-icon";
import {
  useCardLabelActions,
  type CardLabelEditorProps,
} from "@/components/use-card-label-actions";
import { sortBoardLabels, type BoardLabelView } from "@/lib/labels";
import { useI18n } from "@/i18n/provider";

export function CardLabelChips({
  labels,
}: {
  labels: readonly BoardLabelView[];
}) {
  if (labels.length === 0) {
    return null;
  }

  return (
    <ul className="card-label-chips">
      {sortBoardLabels(labels).map((label) => (
        <li
          key={label.id}
          className="card-label-chip"
          data-color={label.color}
        >
          {label.name}
        </li>
      ))}
    </ul>
  );
}

type CardLabelMenuProps = CardLabelEditorProps & {
  placement?: "bottom-start" | "right-start";
  variant?: "card" | "sheet";
};

export function CardLabelMenu({
  placement = "bottom-start",
  variant = "card",
  ...editorProps
}: CardLabelMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    strategy: "fixed",
    middleware: [offset(8), flip(), shift({ padding: 10 })],
    whileElementsMounted: autoUpdate,
  });
  const click = useClick(context);
  const dismiss = useDismiss(context, { ancestorScroll: true });
  const role = useRole(context, { role: "menu" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);
  const triggerClass =
    variant === "sheet"
      ? `sheet-icon-btn${open ? " is-open" : ""}`
      : `card-label-trigger${open ? " is-open" : ""}`;

  return (
    <>
      <button
        type="button"
        className={triggerClass}
        ref={(node) => {
          refs.setReference(node);
        }}
        data-sheet-labels=""
        aria-label={t.cardPage.labelsAria}
        aria-expanded={open}
        aria-haspopup="menu"
        title={t.cardPage.labelsAria}
        {...getReferenceProps({
          onClick: (event) => {
            event.stopPropagation();
          },
          onPointerDown: (event) => {
            event.stopPropagation();
          },
        })}
      >
        <CardLabelIcon size={variant === "sheet" ? 18 : 15} />
      </button>
      {open ? (
        <FloatingPortal>
          <div
            className="card-label-menu"
            ref={(node) => {
              refs.setFloating(node);
            }}
            style={floatingStyles}
            {...getFloatingProps({
              onClick: (event) => {
                event.stopPropagation();
              },
              onPointerDown: (event) => {
                event.stopPropagation();
              },
            })}
          >
            <CardLabelList {...editorProps} />
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
}

function CardLabelList(props: CardLabelEditorProps) {
  const { t } = useI18n();
  const actions = useCardLabelActions(props);
  const catalog = sortBoardLabels(props.boardLabels);
  const selectedIds = new Set(props.selectedLabels.map((label) => label.id));

  if (catalog.length === 0) {
    return <p className="board-label-empty">{t.board.labelsEmpty}</p>;
  }

  return (
    <ul className="card-label-picks" aria-label={t.cardPage.labelsAria}>
      {catalog.map((label) => {
        const selected = selectedIds.has(label.id);
        return (
          <li key={label.id}>
            <button
              type="button"
              className={
                selected ? "card-label-chip is-on" : "card-label-chip"
              }
              data-color={label.color}
              aria-pressed={selected}
              aria-label={t.cardPage.labelToggleAria.replace(
                "{name}",
                label.name,
              )}
              onClick={() => {
                void actions.toggleLabel(label);
              }}
            >
              {label.name}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
