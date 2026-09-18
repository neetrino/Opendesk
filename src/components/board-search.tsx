"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SearchIcon } from "@/components/search-icon";
import { useI18n } from "@/i18n/provider";
import {
  boardFiltersAreEmpty,
  cloneBoardFilters,
  EMPTY_BOARD_FILTERS,
  type BoardCardFilters,
} from "@/lib/card-query";
import type { BoardLabelView } from "@/lib/labels";

export type BoardSearchParticipant = {
  id: string;
  displayName: string;
  avatarKey: string | null;
};

type BoardSearchCatalog = {
  labels: BoardLabelView[];
  participants: BoardSearchParticipant[];
};

type BoardSearchContextValue = {
  query: string;
  setQuery: (query: string) => void;
  filters: BoardCardFilters;
  applyFilters: (filters: BoardCardFilters) => void;
  resetFilters: () => void;
  mobileOpen: boolean;
  closeMobile: () => void;
  toggleMobile: () => void;
  catalog: BoardSearchCatalog;
  setCatalog: (catalog: BoardSearchCatalog) => void;
};

const BoardSearchContext = createContext<BoardSearchContextValue | null>(null);

const EMPTY_CATALOG: BoardSearchCatalog = {
  labels: [],
  participants: [],
};

export function BoardSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<BoardCardFilters>(EMPTY_BOARD_FILTERS);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catalog, setCatalog] = useState<BoardSearchCatalog>(EMPTY_CATALOG);

  const resetFilters = useCallback(() => {
    setFilters(cloneBoardFilters(EMPTY_BOARD_FILTERS));
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    setQuery("");
    setFilters(cloneBoardFilters(EMPTY_BOARD_FILTERS));
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((current) => {
      if (current) {
        setQuery("");
        setFilters(cloneBoardFilters(EMPTY_BOARD_FILTERS));
        return false;
      }
      return true;
    });
  }, []);

  const applyFilters = useCallback((next: BoardCardFilters) => {
    setFilters(cloneBoardFilters(next));
  }, []);

  const value = useMemo(
    () => ({
      query,
      setQuery,
      filters,
      applyFilters,
      resetFilters,
      mobileOpen,
      closeMobile,
      toggleMobile,
      catalog,
      setCatalog,
    }),
    [
      applyFilters,
      catalog,
      closeMobile,
      filters,
      mobileOpen,
      query,
      resetFilters,
      toggleMobile,
    ],
  );

  return (
    <BoardSearchContext.Provider value={value}>
      {children}
    </BoardSearchContext.Provider>
  );
}

export function useBoardSearch(): BoardSearchContextValue {
  const context = useContext(BoardSearchContext);
  if (!context) {
    throw new Error("useBoardSearch must be used within BoardSearchProvider");
  }
  return context;
}

export function useRegisterBoardSearchCatalog(
  labels: readonly BoardLabelView[],
  participants: readonly BoardSearchParticipant[],
): void {
  const { setCatalog } = useBoardSearch();
  const labelKey = labels.map((label) => label.id).join(",");
  const peopleKey = participants.map((person) => person.id).join(",");

  useEffect(() => {
    setCatalog({
      labels: [...labels],
      participants: [...participants],
    });
  }, [labelKey, labels, peopleKey, participants, setCatalog]);
}

export function BoardSearchDockButton() {
  const { t } = useI18n();
  const { query, filters, mobileOpen, toggleMobile } = useBoardSearch();
  const active =
    mobileOpen || query.trim().length > 0 || !boardFiltersAreEmpty(filters);

  return (
    <button
      type="button"
      className={active ? "board-dock-search is-active" : "board-dock-search"}
      aria-label={active ? t.board.searchClose : t.board.searchOpen}
      aria-pressed={active}
      title={active ? t.board.searchClose : t.board.searchOpen}
      onClick={toggleMobile}
    >
      <SearchIcon size={18} />
    </button>
  );
}
