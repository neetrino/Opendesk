import { describe, expect, it } from "vitest";
import {
  agentKeyMatches,
  agentKeyPrefix,
  createAgentKey,
  hashAgentKey,
  parseBearerAgentKey,
} from "@/lib/agent-key";
import { formatBoardAgentMcpConfig } from "@/lib/agent-mcp-config";

describe("agent key", () => {
  it("issues an od_ secret whose hash matches and prefix is stable", () => {
    const key = createAgentKey();
    expect(key.startsWith("od_")).toBe(true);
    expect(hashAgentKey(key)).toMatch(/^[a-f0-9]{64}$/);
    expect(agentKeyMatches(hashAgentKey(key), key)).toBe(true);
    expect(agentKeyMatches(hashAgentKey(key), `${key}x`)).toBe(false);
    expect(agentKeyPrefix(key)).toBe(key.slice(0, 8));
  });

  it("reads the bearer token and rejects a join-style value", () => {
    const key = "od_abcDEF0123456789_-";
    expect(parseBearerAgentKey(`Bearer ${key}`)).toBe(key);
    expect(parseBearerAgentKey("Bearer not-a-key")).toBeNull();
    expect(parseBearerAgentKey(null)).toBeNull();
  });

  it("writes a Cursor MCP file for this origin", () => {
    const json = formatBoardAgentMcpConfig("https://desk.example", "od_secret");
    const parsed = JSON.parse(json) as {
      mcpServers: { opendesk: { url: string; headers: { Authorization: string } } };
    };
    expect(parsed.mcpServers.opendesk.url).toBe("https://desk.example/api/mcp");
    expect(parsed.mcpServers.opendesk.headers.Authorization).toBe(
      "Bearer od_secret",
    );
  });
});
