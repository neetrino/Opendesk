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
  owned: BoardsListBoard[];
  invited: BoardsListBoard[];
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

export function BoardsList({ owned, invited }: BoardsListProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { countsByBoardId } = useBoardsInbox();
  const closeCreate = useCallback(() => {
    setCreateOpen(false);
  }, []);
  const visibleOwned = useMemo(
    () => filterBoardsByQuery(owned, query),
    [owned, query],
  );
  const visibleInvited = useMemo(
    () => filterBoardsByQuery(invited, query),
    [invited, query],
  );
  const hasBoards = owned.length + invited.length > 0;
  const visibleCount = visibleOwned.length + visibleInvited.length;

  function renderGroup(title: string, boards: BoardsListBoard[]) {
    if (boards.length === 0) {
      return null;
    }
    return (
      <section className="boards-list-group">
        <h2 className="boards-list-group-title">{title}</h2>
        <ul className="boards-list">
          {boards.map((board) => (
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
      </section>
    );
  }

  return (
    <div className="boards-list-panel">
      <div className="boards-list-toolbar">
        {hasBoards ? (
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
      {hasBoards && visibleCount === 0 ? (
        <p className="boards-list-empty">{t.boardsPage.searchEmpty}</p>
      ) : null}
      {renderGroup(t.boardsPage.owned, visibleOwned)}
      {renderGroup(t.boardsPage.invited, visibleInvited)}
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
