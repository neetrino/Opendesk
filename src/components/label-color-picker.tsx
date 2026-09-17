"use client";

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

  return (
    <div
      className="label-color-picker"
      role="radiogroup"
      aria-label={t.cardPage.labelColorsAria.replace("{name}", name)}
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
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}
