"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SearchIcon } from "@/components/search-icon";
import { useI18n } from "@/i18n/provider";

type BoardSearchContextValue = {
  query: string;
  setQuery: (query: string) => void;
  mobileOpen: boolean;
  closeMobile: () => void;
  toggleMobile: () => void;
};

const BoardSearchContext = createContext<BoardSearchContextValue | null>(null);

export function BoardSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    setQuery("");
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((current) => {
      if (current) {
        setQuery("");
        return false;
      }
      return true;
    });
  }, []);

  const value = useMemo(
    () => ({ query, setQuery, mobileOpen, closeMobile, toggleMobile }),
    [query, mobileOpen, closeMobile, toggleMobile],
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

export function BoardSearchField() {
  const { t } = useI18n();
  const { query, setQuery } = useBoardSearch();

  return (
    <div className="board-search" role="search">
      <SearchIcon className="board-search-icon" size={15} />
      <label className="visually-hidden" htmlFor="board-card-search">
        {t.board.searchLabel}
      </label>
      <input
        id="board-card-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t.board.searchPlaceholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
    </div>
  );
}

export function BoardSearchDockButton() {
  const { t } = useI18n();
  const { query, mobileOpen, toggleMobile } = useBoardSearch();
  const active = mobileOpen || query.trim().length > 0;

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

export function BoardSearchMobileBar() {
  const { t } = useI18n();
  const { query, setQuery, mobileOpen, closeMobile } = useBoardSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const visible = mobileOpen;

  useEffect(() => {
    if (mobileOpen) {
      inputRef.current?.focus();
    }
  }, [mobileOpen]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        closeMobile();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeMobile, visible]);

  if (!visible) {
    return null;
  }

  return (
    <div className="board-search-mobile" role="search">
      <label className="visually-hidden" htmlFor="board-card-search-mobile">
        {t.board.searchLabel}
      </label>
      <input
        ref={inputRef}
        id="board-card-search-mobile"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t.board.searchPlaceholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
    </div>
  );
}
