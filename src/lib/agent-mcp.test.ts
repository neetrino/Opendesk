import { describe, expect, it } from "vitest";
import { handleAgentMcpMessage, parseMcpJsonBody } from "@/lib/agent-mcp";
import { isAgentStatus } from "@/lib/agent-mcp-catalog";

const boardId = "clboardxxxxxxxxxxxxxxxxxxxx";

describe("agent mcp", () => {
  it("accepts only in_progress and answered", () => {
    expect(isAgentStatus("in_progress")).toBe(true);
    expect(isAgentStatus("answered")).toBe(true);
    expect(isAgentStatus("new")).toBe(false);
    expect(isAgentStatus("done")).toBe(false);
  });

  it("answers initialize and lists the three tools", async () => {
    const init = await handleAgentMcpMessage(boardId, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-03-26" },
    });
    expect(init.status).toBe(200);
    expect(init.body).toContain("opendesk");
    expect(init.body).toContain("2025-03-26");

    const listed = await handleAgentMcpMessage(boardId, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
    });
    expect(listed.body).toContain("list_tasks");
    expect(listed.body).toContain("get_task");
    expect(listed.body).toContain("set_status");
  });

  it("rejects set_status to done before touching the board", async () => {
    const result = await handleAgentMcpMessage(boardId, {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "set_status",
        arguments: { cardId: "clcardxxxxxxxxxxxxxxxxxxxxx", status: "done" },
      },
    });
    expect(result.status).toBe(200);
    expect(result.body).toContain("in_progress or answered");
  });

  it("acks notifications without a JSON body", async () => {
    const result = await handleAgentMcpMessage(boardId, {
      jsonrpc: "2.0",
      method: "notifications/initialized",
    });
    expect(result).toEqual({ status: 202, body: null });
  });

  it("treats invalid JSON as a parse error", () => {
    expect(parseMcpJsonBody("{")).toBeUndefined();
  });
});
