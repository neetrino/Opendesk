"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { InviteButton } from "@/components/invite-button";
import { MAX_BOARD_PARTICIPANTS } from "@/lib/constants";
import { useI18n } from "@/i18n/provider";
import { BoardAvatar } from "@/components/board-avatar";

export type BoardParticipant = {
  id: string;
  displayName: string;
  avatarKey: string | null;
  createdAt: Date | string;
};

type ParticipantsPanelProps = {
  participants: BoardParticipant[];
  locale: string;
  slug: string;
  joinToken: string;
};

type ParticipantsListProps = {
  participants: BoardParticipant[];
  locale: string;
};

export function ParticipantsList({
  participants,
  locale,
}: ParticipantsListProps) {
  const { t } = useI18n();

  if (participants.length === 0) {
    return <p className="muted">{t.board.participantsEmpty}</p>;
  }

  return (
    <ul className="participants-list">
      {participants.map((person) => {
        const joined = new Date(person.createdAt);
        return (
          <li key={person.id} className="participants-row">
            <span className="participants-name">
              <BoardAvatar
                name={person.displayName}
                mark={person.avatarKey}
                size="md"
              />
              {person.displayName}
            </span>
            <span className="participants-joined">
              {t.board.joinedAt}{" "}
              {joined.toLocaleString(locale, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function PersonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5.5 19.25c.9-3.2 3.2-4.75 6.5-4.75s5.6 1.55 6.5 4.75"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ParticipantsPanel({
  participants,
  locale,
  slug,
  joinToken,
}: ParticipantsPanelProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const count = participants.length;
  const label = `${count}/${MAX_BOARD_PARTICIPANTS}`;

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="participants-count"
        aria-label={`${t.board.participantsAria}: ${label}`}
        onClick={() => setOpen(true)}
      >
        <PersonIcon />
        <span>{label}</span>
      </button>

      {open
        ? createPortal(
            <div className="sheet-root" role="presentation">
              <button
                type="button"
                className="sheet-backdrop"
                aria-label={t.board.closeParticipants}
                onClick={() => setOpen(false)}
              />
              <aside
                className="card-sheet participants-sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby="participants-sheet-title"
              >
                <div className="sheet-handle" aria-hidden="true" />
                <header className="sheet-header">
                  <div className="sheet-badges">
                    <h2
                      id="participants-sheet-title"
                      className="participants-sheet-title"
                    >
                      {t.board.participantsTitle}
                    </h2>
                    <span className="participants-sheet-count">{label}</span>
                  </div>
                  <button
                    type="button"
                    className="sheet-icon-btn"
                    aria-label={t.board.closeParticipants}
                    onClick={() => setOpen(false)}
                  >
                    ×
                  </button>
                </header>

                <div className="sheet-body">
                  <div className="sheet-details">
                    <div className="sheet-block">
                      <InviteButton slug={slug} joinToken={joinToken} />
                    </div>
                    <ParticipantsList
                      participants={participants}
                      locale={locale}
                    />
                  </div>
                </div>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
