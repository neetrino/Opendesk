"use client";

import { useI18n } from "@/i18n/provider";
import type { BoardInboxCounts } from "@/lib/card-reads";

type InboxCountsProps = {
  counts: BoardInboxCounts;
};

function compactCount(value: number): string {
  return value > 99 ? "99+" : String(value);
}

function TaskInboxIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="5"
        width="16"
        height="14"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 9.5h8M8 14h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MessageInboxIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 6.5h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InboxCounts({ counts }: InboxCountsProps) {
  const { t } = useI18n();
  const hasTasks = counts.newTasks > 0;
  const hasMessages = counts.newMessages > 0;
  if (!hasTasks && !hasMessages) {
    return null;
  }

  return (
    <div className="inbox-counts">
      {hasTasks ? (
        <span
          className="inbox-count"
          aria-label={t.boardsPage.newTasksAria.replace(
            "{n}",
            String(counts.newTasks),
          )}
        >
          <TaskInboxIcon />
          {compactCount(counts.newTasks)}
        </span>
      ) : null}
      {hasMessages ? (
        <span
          className="inbox-count is-messages"
          aria-label={t.boardsPage.newMessagesAria.replace(
            "{n}",
            String(counts.newMessages),
          )}
        >
          <MessageInboxIcon />
          {compactCount(counts.newMessages)}
        </span>
      ) : null}
    </div>
  );
}
