"use client";

import type { ReactNode } from "react";
import { BoardAvatar } from "@/components/board-avatar";
import { useI18n } from "@/i18n/provider";
import {
  customPeriodIsValid,
  type AttentionFilter,
  type BoardCardFilters,
  type PeriodPreset,
} from "@/lib/card-query";
import { sortBoardLabels, type BoardLabelView } from "@/lib/labels";

export type FilterParticipant = {
  id: string;
  displayName: string;
  avatarKey: string | null;
};

type BoardFilterPanelProps = {
  filters: BoardCardFilters;
  labels: readonly BoardLabelView[];
  participants: readonly FilterParticipant[];
  onChange: (filters: BoardCardFilters) => void;
  onApply: () => void;
  onReset: () => void;
};

function toggleValue<T extends string>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function BoardFilterPanel({
  filters,
  labels,
  participants,
  onChange,
  onApply,
  onReset,
}: BoardFilterPanelProps) {
  const { t } = useI18n();
  const catalog = sortBoardLabels(labels);
  const applyDisabled = !customPeriodIsValid(filters);

  return (
    <div className="board-filter-panel" role="dialog" aria-label={t.board.filterPanelAria}>
      <FilterGroup label={t.board.filterLabel}>
        <ChipToggle
          pressed={filters.unlabeled}
          onClick={() =>
            onChange({ ...filters, unlabeled: !filters.unlabeled })
          }
        >
          {t.board.filterUnlabeled}
        </ChipToggle>
        {catalog.map((label) => (
          <ChipToggle
            key={label.id}
            pressed={filters.labelIds.includes(label.id)}
            color={label.color}
            onClick={() =>
              onChange({
                ...filters,
                labelIds: toggleValue(filters.labelIds, label.id),
              })
            }
          >
            {label.name}
          </ChipToggle>
        ))}
      </FilterGroup>

      <FilterGroup label={t.board.filterAuthor}>
        {participants.map((person) => (
          <ChipToggle
            key={person.id}
            pressed={filters.authorIds.includes(person.id)}
            onClick={() =>
              onChange({
                ...filters,
                authorIds: toggleValue(filters.authorIds, person.id),
              })
            }
          >
            <BoardAvatar
              name={person.displayName}
              mark={person.avatarKey}
              size="sm"
            />
            {person.displayName}
          </ChipToggle>
        ))}
      </FilterGroup>

      <FilterGroup label={t.board.filterPeriod}>
        <PeriodChip
          current={filters.period}
          value={null}
          label={t.board.filterAnyTime}
          onChange={(period) =>
            onChange({ ...filters, period, customFrom: "", customTo: "" })
          }
        />
        <PeriodChip
          current={filters.period}
          value="today"
          label={t.board.filterToday}
          onChange={(period) => onChange({ ...filters, period })}
        />
        <PeriodChip
          current={filters.period}
          value="last5"
          label={t.board.filterLast5Days}
          onChange={(period) => onChange({ ...filters, period })}
        />
        <PeriodChip
          current={filters.period}
          value="custom"
          label={t.board.filterCustom}
          onChange={(period) => onChange({ ...filters, period })}
        />
        {filters.period === "custom" ? (
          <div className="board-filter-dates">
            <label>
              {t.board.filterFrom}
              <input
                type="date"
                value={filters.customFrom}
                onChange={(event) =>
                  onChange({ ...filters, customFrom: event.target.value })
                }
              />
            </label>
            <label>
              {t.board.filterTo}
              <input
                type="date"
                value={filters.customTo}
                onChange={(event) =>
                  onChange({ ...filters, customTo: event.target.value })
                }
              />
            </label>
          </div>
        ) : null}
      </FilterGroup>

      <FilterGroup label={t.board.filterInbox}>
        <ChipToggle
          pressed={filters.attention.includes("unread")}
          onClick={() =>
            onChange({
              ...filters,
              attention: toggleValue<AttentionFilter>(
                filters.attention,
                "unread",
              ),
            })
          }
        >
          {t.board.filterUnread}
        </ChipToggle>
        <ChipToggle
          pressed={filters.attention.includes("new")}
          onClick={() =>
            onChange({
              ...filters,
              attention: toggleValue<AttentionFilter>(
                filters.attention,
                "new",
              ),
            })
          }
        >
          {t.board.filterNew}
        </ChipToggle>
        <ChipToggle
          pressed={filters.urgent}
          onClick={() => onChange({ ...filters, urgent: !filters.urgent })}
        >
          {t.board.filterUrgent}
        </ChipToggle>
        <ChipToggle
          pressed={filters.hasFile}
          onClick={() => onChange({ ...filters, hasFile: !filters.hasFile })}
        >
          {t.board.filterHasFile}
        </ChipToggle>
      </FilterGroup>

      <div className="board-filter-actions">
        <button type="button" className="button-cancel" onClick={onReset}>
          {t.board.filterReset}
        </button>
        <button
          type="button"
          className="button-save"
          disabled={applyDisabled}
          onClick={onApply}
        >
          {t.board.filterApply}
        </button>
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="board-filter-group">
      <p className="board-filter-label">{label}</p>
      <div className="board-filter-chips">{children}</div>
    </div>
  );
}

function ChipToggle({
  pressed,
  onClick,
  children,
  color,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
  color?: string;
}) {
  const className = color
    ? pressed
      ? "board-filter-label-chip is-on"
      : "board-filter-label-chip"
    : pressed
      ? "chip chip-active"
      : "chip";

  return (
    <button
      type="button"
      className={className}
      data-color={color}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {pressed ? <FilterCheckIcon /> : null}
      {children}
    </button>
  );
}

function FilterCheckIcon() {
  return (
    <svg
      className="board-filter-check"
      viewBox="0 0 24 24"
      width="11"
      height="11"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M5 12.5 9.5 17 19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PeriodChip({
  current,
  value,
  label,
  onChange,
}: {
  current: PeriodPreset | null;
  value: PeriodPreset | null;
  label: string;
  onChange: (period: PeriodPreset | null) => void;
}) {
  return (
    <ChipToggle pressed={current === value} onClick={() => onChange(value)}>
      {label}
    </ChipToggle>
  );
}
