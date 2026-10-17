"use client";

import { useEffect, useRef, useState } from "react";
import {
  disableBoardAgentAccessAction,
  enableBoardAgentAccessAction,
  getBoardAgentAccessAction,
  rotateBoardAgentAccessAction,
} from "@/lib/agent-access-actions";
import {
  agentAccessHint,
  copyAgentAccess,
  startMessageTimer,
} from "@/lib/board-agent-access-ui";

export type AgentAccessCopy = {
  agentAccessHint: string;
  agentAccessPasteHint: string;
  agentAccessCopied: string;
  agentAccessCopyFailed: string;
  agentAccessDisabled: string;
};

export type BoardAgentAccessState = {
  enabled: boolean;
  secret: string | null;
  keyPrefix: string | null;
  pending: boolean;
  loaded: boolean;
  message: string | null;
  hint: string;
  enable: () => Promise<void>;
  copy: () => Promise<void>;
  rotate: () => Promise<void>;
  disable: () => Promise<void>;
};

export function useBoardAgentAccess(
  boardId: string,
  board: AgentAccessCopy,
): BoardAgentAccessState {
  const [enabled, setEnabled] = useState(false);
  const [keyPrefix, setKeyPrefix] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getBoardAgentAccessAction(boardId).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setEnabled(result.data.enabled);
        setKeyPrefix(result.data.keyPrefix);
        setLoaded(true);
        return;
      }
      setMessage(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  function flash(text: string): void {
    setMessage(text);
    startMessageTimer(timer, () => setMessage(null));
  }

  async function afterIssue(token: string, prefix: string): Promise<void> {
    setEnabled(true);
    setKeyPrefix(prefix);
    setSecret(token);
    flash(await copyAgentAccess(token, window.location.origin, board));
  }

  return {
    enabled,
    secret,
    keyPrefix,
    pending,
    loaded,
    message,
    hint: message ?? agentAccessHint(enabled, secret, board),
    enable: () => {
      if (!loaded) {
        return Promise.resolve();
      }
      return runEnable(
        pending,
        setPending,
        boardId,
        flash,
        afterIssue,
        (prefix) => {
          setEnabled(true);
          setKeyPrefix(prefix);
          setSecret(null);
        },
      );
    },
    copy: async () => {
      if (secret) {
        flash(await copyAgentAccess(secret, window.location.origin, board));
      }
    },
    rotate: () =>
      runIssue(
        pending,
        setPending,
        () => rotateBoardAgentAccessAction(boardId),
        flash,
        afterIssue,
      ),
    disable: () =>
      runDisable(boardId, pending, setPending, flash, board, () => {
        setEnabled(false);
        setKeyPrefix(null);
        setSecret(null);
      }),
  };
}

async function runEnable(
  pending: boolean,
  setPending: (value: boolean) => void,
  boardId: string,
  flash: (text: string) => void,
  afterIssue: (token: string, prefix: string) => Promise<void>,
  keepExisting: (prefix: string) => void,
): Promise<void> {
  if (pending) {
    return;
  }
  setPending(true);
  const result = await enableBoardAgentAccessAction(boardId);
  setPending(false);
  if (!result.ok) {
    flash(result.error);
    return;
  }
  if (!result.data.created) {
    keepExisting(result.data.keyPrefix);
    return;
  }
  await afterIssue(result.data.token, result.data.keyPrefix);
}

type IssueResult =
  | { ok: true; data: { token: string; keyPrefix: string } }
  | { ok: false; error: string };

async function runIssue(
  pending: boolean,
  setPending: (value: boolean) => void,
  issue: () => Promise<IssueResult>,
  flash: (text: string) => void,
  afterIssue: (token: string, prefix: string) => Promise<void>,
): Promise<void> {
  if (pending) {
    return;
  }
  setPending(true);
  const result = await issue();
  setPending(false);
  if (!result.ok) {
    flash(result.error);
    return;
  }
  await afterIssue(result.data.token, result.data.keyPrefix);
}

async function runDisable(
  boardId: string,
  pending: boolean,
  setPending: (value: boolean) => void,
  flash: (text: string) => void,
  board: AgentAccessCopy,
  reset: () => void,
): Promise<void> {
  if (pending) {
    return;
  }
  setPending(true);
  const result = await disableBoardAgentAccessAction(boardId);
  setPending(false);
  if (!result.ok) {
    flash(result.error);
    return;
  }
  reset();
  flash(board.agentAccessDisabled);
}
