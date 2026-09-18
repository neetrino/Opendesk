"use client";

import { useEffect, useRef, useState } from "react";
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { BoardFilterPanel } from "@/components/board-filter-panel";
import { useBoardSearch } from "@/components/board-search";
import { SearchIcon } from "@/components/search-icon";
import { useI18n } from "@/i18n/provider";
import {
  boardFilterChips,
  boardFiltersAreEmpty,
  cloneBoardFilters,
  customPeriodIsValid,
  EMPTY_BOARD_FILTERS,
  type FilterChipKey,
} from "@/lib/card-query";
import { CARD_SEARCH_MAX_LENGTH } from "@/lib/constants";

type BoardSearchFieldControlProps = {
  id: string;
  autoFocus?: boolean;
};

const CHIP_LABEL: Record<FilterChipKey, "filterLabel" | "filterAuthor" | "filterPeriod" | "filterInbox" | "filterUrgent" | "filterHasFile"> = {
  label: "filterLabel",
  author: "filterAuthor",
  period: "filterPeriod",
  inbox: "filterInbox",
  urgent: "filterUrgent",
  hasFile: "filterHasFile",
};

export function BoardSearchField() {
  return (
    <div className="board-search">
      <BoardSearchFieldControl id="board-card-search" />
    </div>
  );
}

export function BoardSearchMobileBar() {
  const { mobileOpen, closeMobile } = useBoardSearch();

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        closeMobile();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeMobile, mobileOpen]);

  if (!mobileOpen) {
    return null;
  }

  return (
    <div className="board-search-mobile">
      <BoardSearchFieldControl id="board-card-search-mobile" autoFocus />
    </div>
  );
}

function BoardSearchFieldControl({
  id,
  autoFocus = false,
}: BoardSearchFieldControlProps) {
  const { t } = useI18n();
  const {
    query,
    setQuery,
    filters,
    applyFilters,
    resetFilters,
    catalog,
  } = useBoardSearch();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => cloneBoardFilters(filters));
  const inputRef = useRef<HTMLInputElement>(null);
  const chips = boardFilterChips(filters);
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setPanelOpen,
    placement: "bottom-start",
    strategy: "fixed",
    middleware: [offset(8), flip(), shift({ padding: 10 })],
    whileElementsMounted: autoUpdate,
  });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "dialog" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    dismiss,
    role,
  ]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  function setPanelOpen(next: boolean): void {
    if (next && !open) {
      setDraft(cloneBoardFilters(filters));
    }
    setOpen(next);
  }

  function applyDraft(): void {
    if (!customPeriodIsValid(draft)) {
      return;
    }
    applyFilters(draft);
    context.onOpenChange(false);
  }

  return (
    <div
      className={
        open || chips.length > 0
          ? "board-search-control is-active"
          : "board-search-control"
      }
      role="search"
      ref={(node) => {
        refs.setReference(node);
      }}
      {...getReferenceProps({
        onClick: () => {
          setPanelOpen(true);
        },
      })}
    >
      <SearchIcon className="board-search-icon" size={15} />
      {chips.map((chip) => (
        <span key={chip.key} className="board-search-chip">
          {t.board[CHIP_LABEL[chip.key]]}
          {chip.count !== null ? ` ${chip.count}` : ""}
        </span>
      ))}
      <label className="visually-hidden" htmlFor={id}>
        {t.board.searchLabel}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setPanelOpen(true)}
        placeholder={chips.length > 0 ? "" : t.board.searchPlaceholder}
        maxLength={CARD_SEARCH_MAX_LENGTH}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {open ? (
        <FloatingPortal>
          <div
            className="board-filter-pop"
            ref={(node) => {
              refs.setFloating(node);
            }}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            <BoardFilterPanel
              filters={draft}
              labels={catalog.labels}
              participants={catalog.participants}
              onChange={setDraft}
              onApply={applyDraft}
              onReset={() => {
                const empty = cloneBoardFilters(EMPTY_BOARD_FILTERS);
                setDraft(empty);
                if (!boardFiltersAreEmpty(filters)) {
                  resetFilters();
                }
              }}
            />
          </div>
        </FloatingPortal>
      ) : null}
    </div>
  );
}
