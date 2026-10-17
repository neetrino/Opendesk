import { NextResponse } from "next/server";
import { handleAgentMcpMessage, parseMcpJsonBody } from "@/lib/agent-mcp";
import { resolveBoardIdFromAgentRequest } from "@/lib/board-agent-access";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * Stateless MCP Streamable HTTP for one board, keyed by Bearer od_…
 */
export async function POST(request: Request): Promise<Response> {
  let boardId: string | null;
  try {
    boardId = await resolveBoardIdFromAgentRequest(request);
  } catch (error) {
    logger.error("agent mcp auth failed", error);
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
  if (!boardId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawText = await request.text();
  const parsed = parseMcpJsonBody(rawText);
  if (parsed === undefined) {
    return jsonRpcResponse(await handleAgentMcpMessage(boardId, null));
  }
  try {
    return jsonRpcResponse(await handleAgentMcpMessage(boardId, parsed));
  } catch (error) {
    logger.error("agent mcp request failed", error);
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}

export function GET(): Response {
  return new NextResponse(null, {
    status: 405,
    headers: { Allow: "POST" },
  });
}

function jsonRpcResponse(result: {
  status: number;
  body: string | null;
}): Response {
  if (result.body === null) {
    return new NextResponse(null, { status: result.status });
  }
  return new NextResponse(result.body, {
    status: result.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
