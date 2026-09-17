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
} from "@floating-ui/react";
import { LABEL_COLOR_KEYS } from "@/lib/constants";
import type { LabelColorKey } from "@/lib/labels";
import { useI18n } from "@/i18n/provider";

type LabelColorPickerProps = {
  value: LabelColorKey;
  name: string;
  onChange: (color: LabelColorKey) => void;
};

export function LabelColorPicker({
  value,
  name,
  onChange,
}: LabelColorPickerProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-start",
    strategy: "fixed",
    middleware: [offset(8), flip(), shift({ padding: 10 })],
    whileElementsMounted: autoUpdate,
  });
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ]);

  return (
    <>
      <button
        type="button"
        className={
          open ? "label-color-trigger is-open" : "label-color-trigger"
        }
        data-color={value}
        ref={refs.setReference}
        aria-label={t.cardPage.labelColorAria.replace("{name}", name)}
        aria-expanded={open}
        aria-haspopup="true"
        title={t.cardPage.labelColorAria.replace("{name}", name)}
        {...getReferenceProps()}
      />
      {open ? (
        <FloatingPortal>
          <div
            className="label-color-picker"
            ref={refs.setFloating}
            style={floatingStyles}
            role="radiogroup"
            aria-label={t.cardPage.labelColorsAria.replace("{name}", name)}
            {...getFloatingProps()}
          >
            {LABEL_COLOR_KEYS.map((color) => (
              <button
                key={color}
                type="button"
                className={
                  color === value ? "label-color-dot is-on" : "label-color-dot"
                }
                data-color={color}
                role="radio"
                aria-checked={color === value}
                aria-label={t.cardPage.labelColorAria.replace("{name}", name)}
                onClick={() => {
                  onChange(color);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
}
