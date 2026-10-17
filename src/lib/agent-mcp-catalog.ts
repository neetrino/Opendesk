export const AGENT_STATUSES = ["in_progress", "answered"] as const;

export type AgentStatus = (typeof AGENT_STATUSES)[number];

export type AgentMcpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export const AGENT_MCP_TOOLS: AgentMcpTool[] = [
  {
    name: "list_tasks",
    description:
      "List every task on this board: id, title, status, urgent, labels, author.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_task",
    description: "Read one task and its chat. Use the card id from list_tasks.",
    inputSchema: {
      type: "object",
      properties: { cardId: { type: "string", description: "Card id" } },
      required: ["cardId"],
      additionalProperties: false,
    },
  },
  {
    name: "set_status",
    description:
      "Move a task to in_progress or answered. Cannot set new or done.",
    inputSchema: {
      type: "object",
      properties: {
        cardId: { type: "string", description: "Card id" },
        status: { type: "string", enum: [...AGENT_STATUSES] },
      },
      required: ["cardId", "status"],
      additionalProperties: false,
    },
  },
];

export function isAgentStatus(value: string): value is AgentStatus {
  return (AGENT_STATUSES as readonly string[]).includes(value);
}

export class AgentToolError extends Error {
  constructor(
    readonly code: "invalid_params" | "not_found" | "unknown_tool",
    message: string,
  ) {
    super(message);
  }
}
