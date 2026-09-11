"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { InviteButton } from "@/components/invite-button";
import {
  ParticipantsList,
  type BoardParticipant,
} from "@/components/participants-panel";
import { SettingsIcon } from "@/components/settings-icon";
import { useI18n } from "@/i18n/provider";
import { MAX_BOARD_PARTICIPANTS } from "@/lib/constants";

type BoardSettingsSheetProps = {
  slug: string;
  joinToken: string;
  participants: BoardParticipant[];
  locale: string;
};

export function BoardSettingsSheet({
  slug,
  joinToken,
  participants,
  locale,
}: BoardSettingsSheetProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const count = `${participants.length}/${MAX_BOARD_PARTICIPANTS}`;

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
        className="board-dock-settings"
        aria-label={t.board.settingsAria}
        onClick={() => setOpen(true)}
      >
        <SettingsIcon size={18} />
        {t.board.settings}
      </button>

      {open
        ? createPortal(
            <div className="sheet-root" role="presentation">
              <button
                type="button"
                className="sheet-backdrop"
                aria-label={t.board.closeSettings}
                onClick={() => setOpen(false)}
              />
              <aside
                className="card-sheet settings-sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby="board-settings-title"
              >
                <div className="sheet-handle" aria-hidden="true" />
                <header className="sheet-header">
                  <h2
                    id="board-settings-title"
                    className="participants-sheet-title"
                  >
                    {t.board.settings}
                  </h2>
                  <button
                    type="button"
                    className="sheet-icon-btn"
                    aria-label={t.board.closeSettings}
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
                    <div className="sheet-block">
                      <div className="sheet-badges">
                        <h3 className="settings-section-title">
                          {t.board.participantsTitle}
                        </h3>
                        <span className="participants-sheet-count">{count}</span>
                      </div>
                      <ParticipantsList
                        participants={participants}
                        locale={locale}
                      />
                    </div>
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
