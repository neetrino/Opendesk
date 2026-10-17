import { formatBoardAgentMcpConfig } from "@/lib/agent-mcp-config";

export function agentAccessHint(
  enabled: boolean,
  secret: string | null,
  board: {
    agentAccessHint: string;
    agentAccessPasteHint: string;
  },
): string {
  if (secret) {
    return board.agentAccessPasteHint;
  }
  return board.agentAccessHint;
}

export async function copyAgentAccess(
  token: string,
  origin: string,
  board: { agentAccessCopied: string; agentAccessCopyFailed: string },
): Promise<string> {
  try {
    await navigator.clipboard.writeText(formatBoardAgentMcpConfig(origin, token));
    return board.agentAccessCopied;
  } catch {
    return board.agentAccessCopyFailed;
  }
}

export function startMessageTimer(
  timer: { current: number | null },
  clear: () => void,
): void {
  if (timer.current !== null) {
    window.clearTimeout(timer.current);
  }
  timer.current = window.setTimeout(clear, 4000);
}
