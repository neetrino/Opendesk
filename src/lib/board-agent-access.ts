import { z } from "zod";
import {
  agentKeyMatches,
  agentKeyPrefix,
  createAgentKey,
  hashAgentKey,
  parseBearerAgentKey,
} from "@/lib/agent-key";
import { prisma } from "@/lib/prisma";

const boardIdSchema = z.string().cuid();

export type BoardAgentAccessStatus = {
  enabled: boolean;
  keyPrefix: string | null;
};

export type IssuedAgentKey = {
  token: string;
  keyPrefix: string;
};

export type EnabledAgentKey =
  | { created: true; token: string; keyPrefix: string }
  | { created: false; keyPrefix: string };

export async function getBoardAgentAccessStatus(
  boardId: string,
): Promise<BoardAgentAccessStatus> {
  const row = await prisma.boardAgentAccess.findUnique({
    where: { boardId },
    select: { keyPrefix: true },
  });
  if (!row) {
    return { enabled: false, keyPrefix: null };
  }
  return { enabled: true, keyPrefix: row.keyPrefix };
}

/** Create a key only when the board has none. An existing key stays valid. */
export async function enableBoardAgentKey(
  boardId: string,
): Promise<EnabledAgentKey> {
  const issued = newAgentKey();
  try {
    await prisma.boardAgentAccess.create({
      data: { boardId, keyHash: issued.keyHash, keyPrefix: issued.keyPrefix },
    });
    return { created: true, token: issued.token, keyPrefix: issued.keyPrefix };
  } catch (error) {
    if (!isUniqueConflict(error)) {
      throw error;
    }
    const existing = await prisma.boardAgentAccess.findUnique({
      where: { boardId },
      select: { keyPrefix: true },
    });
    if (!existing) {
      throw error;
    }
    return { created: false, keyPrefix: existing.keyPrefix };
  }
}

/** Replace the board key. The previous token stops working. */
export async function rotateBoardAgentKey(
  boardId: string,
): Promise<IssuedAgentKey> {
  const issued = newAgentKey();
  await prisma.boardAgentAccess.upsert({
    where: { boardId },
    create: {
      boardId,
      keyHash: issued.keyHash,
      keyPrefix: issued.keyPrefix,
    },
    update: { keyHash: issued.keyHash, keyPrefix: issued.keyPrefix },
  });
  return { token: issued.token, keyPrefix: issued.keyPrefix };
}

function newAgentKey(): { token: string; keyHash: string; keyPrefix: string } {
  const token = createAgentKey();
  return {
    token,
    keyHash: hashAgentKey(token),
    keyPrefix: agentKeyPrefix(token),
  };
}

function isUniqueConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function disableBoardAgentAccess(boardId: string): Promise<void> {
  await prisma.boardAgentAccess.deleteMany({ where: { boardId } });
}

export async function resolveBoardIdFromAgentRequest(
  request: Request,
): Promise<string | null> {
  const key = parseBearerAgentKey(request.headers.get("authorization"));
  if (!key) {
    return null;
  }
  const row = await prisma.boardAgentAccess.findUnique({
    where: { keyHash: hashAgentKey(key) },
    select: { boardId: true, keyHash: true },
  });
  if (!row || !agentKeyMatches(row.keyHash, key)) {
    return null;
  }
  return row.boardId;
}

export function parseOwnerBoardId(boardId: string): string | null {
  const parsed = boardIdSchema.safeParse(boardId);
  return parsed.success ? parsed.data : null;
}
