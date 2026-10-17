"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SettingsIcon } from "@/components/settings-icon";
import { useI18n } from "@/i18n/provider";
import { useBoardAgentAccess } from "@/lib/use-board-agent-access";

type BoardAgentAccessProps = {
  boardId: string;
};

type ConfirmKind = "rotate" | "disable";

export function BoardAgentAccess({ boardId }: BoardAgentAccessProps) {
  const { t } = useI18n();
  const access = useBoardAgentAccess(boardId, t.board);
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null);

  return (
    <div className="sheet-block">
      <h3 className="settings-section-title">{t.board.agentAccessTitle}</h3>
      <div className="invite-actions">
        <AgentAccessButtons
          enabled={access.enabled}
          secret={access.secret}
          loaded={access.loaded}
          pending={access.pending}
          keyPrefix={access.keyPrefix}
          onEnable={() => void access.enable()}
          onCopy={() => void access.copy()}
          onRotate={() => setConfirm("rotate")}
          onDisable={() => setConfirm("disable")}
        />
        <p className="muted invite-hint">{access.hint}</p>
      </div>
      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm === "rotate"
            ? t.board.agentAccessRotateConfirm
            : t.board.agentAccessDisableConfirm
        }
        description={
          confirm === "rotate"
            ? t.board.agentAccessRotateHint
            : t.board.agentAccessDisableHint
        }
        icon={<SettingsIcon size={20} />}
        cancelLabel={t.board.agentAccessCancel}
        confirmLabel={
          confirm === "rotate"
            ? t.board.agentAccessRotateYes
            : t.board.agentAccessDisableYes
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const kind = confirm;
          setConfirm(null);
          if (kind === "rotate") {
            void access.rotate();
            return;
          }
          void access.disable();
        }}
      />
    </div>
  );
}

function AgentAccessButtons({
  enabled,
  secret,
  loaded,
  pending,
  keyPrefix,
  onEnable,
  onCopy,
  onRotate,
  onDisable,
}: {
  enabled: boolean;
  secret: string | null;
  loaded: boolean;
  pending: boolean;
  keyPrefix: string | null;
  onEnable: () => void;
  onCopy: () => void;
  onRotate: () => void;
  onDisable: () => void;
}) {
  const { t } = useI18n();
  if (!loaded || !enabled) {
    return (
      <button
        type="button"
        className="button"
        disabled={!loaded || pending}
        onClick={onEnable}
      >
        {pending ? t.board.agentAccessEnabling : t.board.agentAccessEnable}
      </button>
    );
  }
  return (
    <>
      {secret ? (
        <button type="button" className="button" disabled={pending} onClick={onCopy}>
          {t.board.agentAccessCopy}
        </button>
      ) : (
        <p className="agent-access-on">
          {t.board.agentAccessEnabled}
          {keyPrefix ? ` · ${keyPrefix}` : ""}
        </p>
      )}
      <div className="agent-access-row">
        <button type="button" className="button-secondary" disabled={pending} onClick={onRotate}>
          {t.board.agentAccessRotate}
        </button>
        <button type="button" className="button-ghost" disabled={pending} onClick={onDisable}>
          {t.board.agentAccessDisable}
        </button>
      </div>
    </>
  );
}
