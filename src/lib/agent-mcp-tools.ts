import type { CardStatus } from "@prisma/client";
import { z } from "zod";
import { AgentToolError, isAgentStatus } from "@/lib/agent-mcp-catalog";
import { formatBoardExport } from "@/lib/board-export-format";
import { loadCardExport } from "@/lib/board-export";
import { CARD_STATUSES } from "@/lib/constants";
import { moveBoardCard } from "@/lib/move-board-card";
import { prisma } from "@/lib/prisma";
import { revalidateBoardPath } from "@/lib/revalidate-board";

const cardIdSchema = z.string().cuid();

export async function callAgentTool(
  boardId: string,
  name: string,
  rawArgs: unknown,
): Promise<string> {
  if (name === "list_tasks") {
    return listTasks(boardId);
  }
  if (name === "get_task") {
    return getTask(boardId, rawArgs);
  }
  if (name === "set_status") {
    return setStatus(boardId, rawArgs);
  }
  throw new AgentToolError("unknown_tool", `Unknown tool: ${name}`);
}

async function listTasks(boardId: string): Promise<string> {
  const cards = await prisma.card.findMany({
    where: { boardId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      status: true,
      urgent: true,
      position: true,
      author: { select: { displayName: true } },
      labels: {
        select: { label: { select: { name: true, position: true } } },
      },
    },
  });
  const tasks = [...cards].sort((left, right) => {
    const delta =
      CARD_STATUSES.indexOf(left.status) - CARD_STATUSES.indexOf(right.status);
    return delta !== 0 ? delta : left.position - right.position;
  });
  return JSON.stringify({ boardId, tasks: tasks.map(toListedTask) }, null, 2);
}

function toListedTask(card: {
  id: string;
  title: string;
  status: CardStatus;
  urgent: boolean;
  position: number;
  author: { displayName: string };
  labels: { label: { name: string; position: number } }[];
}): Record<string, unknown> {
  return {
    id: card.id,
    title: card.title,
    status: card.status,
    urgent: card.urgent,
    author: card.author.displayName,
    labels: [...card.labels]
      .sort((left, right) => left.label.position - right.label.position)
      .map((item) => item.label.name),
  };
}

async function getTask(boardId: string, rawArgs: unknown): Promise<string> {
  const cardId = readCardId(rawArgs);
  const loaded = await loadCardExport(boardId, cardId);
  if (!loaded) {
    throw new AgentToolError("not_found", "Card not found");
  }
  return formatBoardExport({
    boardId,
    title: loaded.title,
    exportedAt: new Date(),
    labels: [],
    cards: [loaded.card],
  });
}

async function setStatus(boardId: string, rawArgs: unknown): Promise<string> {
  const args = asRecord(rawArgs);
  const cardId = readCardId(args);
  const status = typeof args.status === "string" ? args.status : "";
  if (!isAgentStatus(status)) {
    throw new AgentToolError(
      "invalid_params",
      "status must be in_progress or answered",
    );
  }
  const moved = await moveBoardCard({
    boardId,
    cardId,
    status,
    placement: { kind: "start" },
  });
  if (moved === "not_found") {
    throw new AgentToolError("not_found", "Card not found");
  }
  await revalidateBoardPath(boardId);
  return JSON.stringify({ id: cardId, status }, null, 2);
}

function readCardId(rawArgs: unknown): string {
  const parsed = cardIdSchema.safeParse(asRecord(rawArgs).cardId);
  if (!parsed.success) {
    throw new AgentToolError("invalid_params", "cardId is required");
  }
  return parsed.data;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}
