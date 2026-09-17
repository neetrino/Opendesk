"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { InviteButton } from "@/components/invite-button";
import { LogoutButton } from "@/components/logout-button";
import { OwnerLogoutButton } from "@/components/owner-logout-button";
import {
  ParticipantsList,
  type BoardParticipant,
} from "@/components/participants-panel";
import { BoardLabelsSettingsSection } from "@/components/board-labels-control";
import { SettingsIcon } from "@/components/settings-icon";
import { useI18n } from "@/i18n/provider";
import { MAX_BOARD_PARTICIPANTS } from "@/lib/constants";
import { BoardAvatar } from "@/components/board-avatar";

const SETTINGS_DOCK_TITLE_MAX_CHARS = 8;

function formatSettingsDockTitle(title: string): string {
  return Array.from(title.trim())
    .slice(0, SETTINGS_DOCK_TITLE_MAX_CHARS)
    .join("");
}

type BoardSettingsSheetProps = {
  slug: string;
  joinToken: string;
  boardTitle: string;
  participants: BoardParticipant[];
  locale: string;
  displayName: string;
  avatarKey: string | null;
  isOwner: boolean;
};

export function BoardSettingsSheet({
  slug,
  joinToken,
  boardTitle,
  participants,
  locale,
  displayName,
  avatarKey,
  isOwner,
}: BoardSettingsSheetProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const count = `${participants.length}/${MAX_BOARD_PARTICIPANTS}`;
  const settingsLabel = `${t.board.settingsAria}: ${boardTitle}`;

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        if (document.querySelector(".confirm-dialog-root")) {
          return;
        }
        if (document.querySelector(".label-color-picker")) {
          return;
        }
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
        aria-label={settingsLabel}
        title={settingsLabel}
        onClick={() => setOpen(true)}
      >
        <SettingsIcon size={18} />
        <span className="board-dock-settings-title">
          {formatSettingsDockTitle(boardTitle)}
        </span>
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
                    <span className="visually-hidden">{t.board.settings}: </span>
                    {boardTitle}
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
                      <div className="board-session-card">
                        <p className="board-identity">
                          <BoardAvatar
                            name={displayName}
                            mark={avatarKey}
                            size="md"
                          />
                          <span>
                            {t.board.youAre}{" "}
                            <strong>{displayName}</strong>
                          </span>
                        </p>
                        {isOwner ? <OwnerLogoutButton /> : <LogoutButton />}
                      </div>
                    </div>
                    <div className="sheet-block">
                      <InviteButton slug={slug} joinToken={joinToken} />
                    </div>
                    <BoardLabelsSettingsSection />
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
