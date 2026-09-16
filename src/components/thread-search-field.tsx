"use client";

import { SearchIcon } from "@/components/search-icon";
import { useI18n } from "@/i18n/provider";

type ThreadSearchFieldProps = {
  value: string;
  hitCount: number | null;
  onChange: (value: string) => void;
};

export function ThreadSearchField({
  value,
  hitCount,
  onChange,
}: ThreadSearchFieldProps) {
  const { t } = useI18n();
  const active = value.trim().length > 0;

  return (
    <div
      className={active ? "thread-search is-active" : "thread-search"}
      role="search"
    >
      <SearchIcon className="thread-search-icon" size={15} />
      <label className="visually-hidden" htmlFor="thread-message-search">
        {t.cardPage.searchThread}
      </label>
      <input
        id="thread-message-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t.cardPage.searchThread}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {hitCount !== null ? (
        <span className="thread-search-count">{hitCount}</span>
      ) : null}
      {active ? (
        <button
          type="button"
          className="thread-search-clear"
          aria-label={t.cardPage.clearSearch}
          onClick={() => onChange("")}
        >
          <SearchClearIcon />
        </button>
      ) : null}
    </div>
  );
}

function SearchClearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        d="M6 6 18 18M18 6 6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
