"use client";

import { useCallback, useMemo, useState } from "react";
import { BoardListItem } from "@/components/board-list-item";
import { CreateBoardSheet } from "@/components/create-board-sheet";
import { useI18n } from "@/i18n/provider";
import { filterBoardsByQuery } from "@/lib/filter-boards";
import { inboxCountsFor, useBoardsInbox } from "@/lib/use-boards-inbox";

export type BoardsListBoard = {
  id: string;
  title: string;
  slug: string;
  joinToken: string;
  createdAtLabel: string;
};

type BoardsListProps = {
  boards: BoardsListBoard[];
};

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BoardsList({ boards }: BoardsListProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { countsByBoardId } = useBoardsInbox();
  const closeCreate = useCallback(() => {
    setCreateOpen(false);
  }, []);
  const visibleBoards = useMemo(
    () => filterBoardsByQuery(boards, query),
    [boards, query],
  );

  return (
    <div className="boards-list-panel">
      <div className="boards-list-toolbar">
        {boards.length > 0 ? (
          <div className="boards-list-search" role="search">
            <label className="visually-hidden" htmlFor="boards-search">
              {t.boardsPage.searchLabel}
            </label>
            <input
              id="boards-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.boardsPage.searchPlaceholder}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
        ) : (
          <p className="boards-list-empty boards-list-empty-inline">
            {t.boardsPage.empty}
          </p>
        )}
        <button
          type="button"
          className="boards-create-btn"
          aria-label={t.boardsPage.createAria}
          title={t.boardForm.create}
          onClick={() => setCreateOpen(true)}
        >
          <PlusIcon />
        </button>
      </div>
      {boards.length > 0 && visibleBoards.length === 0 ? (
        <p className="boards-list-empty">{t.boardsPage.searchEmpty}</p>
      ) : null}
      {visibleBoards.length > 0 ? (
        <ul className="boards-list">
          {visibleBoards.map((board) => (
            <BoardListItem
              key={board.id}
              title={board.title}
              slug={board.slug}
              joinToken={board.joinToken}
              createdAtLabel={board.createdAtLabel}
              inbox={inboxCountsFor(countsByBoardId, board.id)}
            />
          ))}
        </ul>
      ) : null}
      <div className="board-dock" role="toolbar" aria-label={t.boardsPage.dockAria}>
        <div className="board-dock-actions">
          <button
            type="button"
            className="board-dock-primary"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon />
            {t.boardForm.create}
          </button>
        </div>
      </div>
      <CreateBoardSheet open={createOpen} onClose={closeCreate} />
    </div>
  );
}
