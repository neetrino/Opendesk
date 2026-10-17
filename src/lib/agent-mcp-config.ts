import { MCP_API_PATH } from "@/lib/constants";

/** Cursor MCP file: this site plus the board key. */
export function formatBoardAgentMcpConfig(origin: string, token: string): string {
  const url = `${origin.replace(/\/$/, "")}${MCP_API_PATH}`;
  return `${JSON.stringify(
    {
      mcpServers: {
        opendesk: {
          url,
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    },
    null,
    2,
  )}\n`;
}
