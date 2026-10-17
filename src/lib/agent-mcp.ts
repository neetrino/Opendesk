import {
  AGENT_MCP_TOOLS,
  AgentToolError,
  isAgentStatus,
} from "@/lib/agent-mcp-catalog";
import { logger } from "@/lib/logger";

const PROTOCOL_VERSIONS = [
  "2024-11-05",
  "2025-03-26",
  "2025-06-18",
  "2026-07-28",
] as const;

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: unknown;
};

export type McpHttpResult = {
  status: number;
  body: string | null;
};

/**
 * Stateless Streamable HTTP JSON-RPC for one board.
 * Notifications return 202 with no body.
 */
export async function handleAgentMcpMessage(
  boardId: string,
  raw: unknown,
): Promise<McpHttpResult> {
  const request = asJsonRpcRequest(raw);
  if (!request) {
    return jsonRpc(null, undefined, parseError());
  }
  if (request.id === undefined) {
    return { status: 202, body: null };
  }
  return dispatch(boardId, { ...request, id: request.id });
}

export function parseMcpJsonBody(text: string): unknown | undefined {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

async function dispatch(
  boardId: string,
  request: JsonRpcRequest & { id: JsonRpcId },
): Promise<McpHttpResult> {
  try {
    if (request.method === "initialize") {
      return jsonRpc(request.id, initializeResult(request.params), undefined);
    }
    if (request.method === "ping") {
      return jsonRpc(request.id, {}, undefined);
    }
    if (request.method === "tools/list") {
      return jsonRpc(request.id, { tools: AGENT_MCP_TOOLS }, undefined);
    }
    if (request.method === "tools/call") {
      return jsonRpc(request.id, await runTool(boardId, request.params), undefined);
    }
    return jsonRpc(request.id, undefined, {
      code: -32601,
      message: `Method not found: ${request.method}`,
    });
  } catch (error) {
    return toolFailure(request.id, error);
  }
}

async function runTool(
  boardId: string,
  params: unknown,
): Promise<{ content: { type: "text"; text: string }[] }> {
  const record = asRecord(params);
  const name = typeof record.name === "string" ? record.name : "";
  if (!name) {
    throw new AgentToolError("invalid_params", "Tool name is required");
  }
  const args = toolArguments(record.arguments);
  if (name === "set_status") {
    const status = asRecord(args).status;
    if (typeof status !== "string" || !isAgentStatus(status)) {
      throw new AgentToolError(
        "invalid_params",
        "status must be in_progress or answered",
      );
    }
  }
  const { callAgentTool } = await import("@/lib/agent-mcp-tools");
  const text = await callAgentTool(boardId, name, args);
  return { content: [{ type: "text", text }] };
}

function initializeResult(params: unknown): Record<string, unknown> {
  const requested = asRecord(params).protocolVersion;
  const protocolVersion =
    typeof requested === "string" &&
    PROTOCOL_VERSIONS.includes(requested as (typeof PROTOCOL_VERSIONS)[number])
      ? requested
      : "2025-03-26";
  return {
    protocolVersion,
    capabilities: { tools: {} },
    serverInfo: { name: "opendesk", version: "0.1.0" },
    instructions:
      "This key opens one OpenDesk board. List tasks, read a chat with get_task," +
      " then set_status to in_progress or answered.",
  };
}

function toolFailure(id: JsonRpcId, error: unknown): McpHttpResult {
  if (error instanceof AgentToolError) {
    const code = error.code === "unknown_tool" ? -32601 : -32602;
    return jsonRpc(id, undefined, { code, message: error.message });
  }
  logger.error("agent mcp tool failed", error);
  return jsonRpc(id, undefined, { code: -32603, message: "Internal error" });
}

function asJsonRpcRequest(raw: unknown): JsonRpcRequest | null {
  const record = asRecord(raw);
  if (record.jsonrpc !== "2.0" || typeof record.method !== "string") {
    return null;
  }
  const id = record.id;
  if (id !== undefined && typeof id !== "string" && typeof id !== "number" && id !== null) {
    return null;
  }
  return {
    jsonrpc: "2.0",
    id: id as JsonRpcId | undefined,
    method: record.method,
    params: record.params,
  };
}

function toolArguments(value: unknown): unknown {
  if (typeof value === "string") {
    const parsed = parseMcpJsonBody(value);
    return parsed === undefined ? {} : parsed;
  }
  return value ?? {};
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function parseError(): { code: number; message: string } {
  return { code: -32700, message: "Parse error" };
}

function jsonRpc(
  id: JsonRpcId,
  result: unknown,
  error: { code: number; message: string } | undefined,
): McpHttpResult {
  const payload = error
    ? { jsonrpc: "2.0", id, error }
    : { jsonrpc: "2.0", id, result };
  return { status: 200, body: `${JSON.stringify(payload)}\n` };
}
