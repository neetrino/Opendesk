"use server";

import {
  disableBoardAgentAccess,
  enableBoardAgentKey,
  getBoardAgentAccessStatus,
  parseOwnerBoardId,
  rotateBoardAgentKey,
  type BoardAgentAccessStatus,
  type EnabledAgentKey,
  type IssuedAgentKey,
} from "@/lib/board-agent-access";
import { tErrors } from "@/lib/i18n-errors";
import { logger } from "@/lib/logger";
import { requireOwnerSession } from "@/lib/owner-session";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/actions";

export async function getBoardAgentAccessAction(
  boardId: string,
): Promise<ActionResult<BoardAgentAccessStatus>> {
  return withOwnerBoard(boardId, (id) => getBoardAgentAccessStatus(id));
}

export async function enableBoardAgentAccessAction(
  boardId: string,
): Promise<ActionResult<EnabledAgentKey>> {
  return withOwnerBoard(boardId, (id) => enableBoardAgentKey(id));
}

export async function rotateBoardAgentAccessAction(
  boardId: string,
): Promise<ActionResult<IssuedAgentKey>> {
  return withOwnerBoard(boardId, (id) => rotateBoardAgentKey(id));
}

export async function disableBoardAgentAccessAction(
  boardId: string,
): Promise<ActionResult> {
  return withOwnerBoard(boardId, async (id) => {
    await disableBoardAgentAccess(id);
    return undefined;
  });
}

async function withOwnerBoard<T>(
  boardId: string,
  run: (id: string) => Promise<T>,
): Promise<ActionResult<T>> {
  const errors = await tErrors();
  const id = parseOwnerBoardId(boardId);
  if (!id) {
    return { ok: false, error: errors.invalidBoard };
  }
  try {
    await requireOwnerSession();
    const board = await prisma.board.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!board) {
      return { ok: false, error: errors.invalidBoard };
    }
    return { ok: true, data: await run(id) };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    logger.error("board agent access failed", error);
    return { ok: false, error: errors.agentAccess };
  }
}
