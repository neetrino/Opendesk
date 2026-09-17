"use server";

import { requireBoardAccess } from "@/lib/board-access";
import { mapBoardLabelRow } from "@/lib/board-labels";
import { MAX_BOARD_LABELS } from "@/lib/constants";
import { mapZodMessage, tErrors } from "@/lib/i18n-errors";
import {
  isUniqueConstraintError,
  nextLabelColor,
  normalizeLabelName,
  parseLabelColor,
  type BoardLabelView,
} from "@/lib/labels";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { revalidateBoardPath } from "@/lib/revalidate-board";
import {
  createBoardLabelSchema,
  deleteBoardLabelSchema,
  renameBoardLabelSchema,
  setBoardLabelColorSchema,
  setCardLabelSchema,
} from "@/lib/validation";
import type { ActionResult } from "@/types/actions";

function namesMatch(left: string, right: string): boolean {
  return left.localeCompare(right, undefined, { sensitivity: "accent" }) === 0;
}

/**
 * Creates a board label.
 */
export async function createBoardLabelAction(
  formData: FormData,
): Promise<ActionResult<BoardLabelView>> {
  const errors = await tErrors();
  const parsed = createBoardLabelSchema.safeParse({
    boardId: formData.get("boardId"),
    cardId: formData.get("cardId") ?? "",
    name: formData.get("name"),
    color: formData.get("color") || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  const name = normalizeLabelName(parsed.data.name);
  if (!name) {
    return { ok: false, error: errors.validation };
  }

  try {
    await requireBoardAccess(parsed.data.boardId);

    const created = await prisma.$transaction(async (tx) => {
      const existing = await tx.boardLabel.findMany({
        where: { boardId: parsed.data.boardId },
        select: { name: true, color: true, position: true },
      });
      if (existing.length >= MAX_BOARD_LABELS) {
        throw new Error("LABEL_LIMIT");
      }
      if (existing.some((label) => namesMatch(label.name, name))) {
        throw new Error("LABEL_EXISTS");
      }

      const colors = existing.flatMap((label) => {
        const color = parseLabelColor(label.color);
        return color ? [color] : [];
      });
      const maxPosition = existing.reduce(
        (max, label) => Math.max(max, label.position),
        -1,
      );
      const label = await tx.boardLabel.create({
        data: {
          boardId: parsed.data.boardId,
          name,
          color: parsed.data.color ?? nextLabelColor(colors),
          position: maxPosition + 1,
        },
      });

      if (parsed.data.cardId) {
        const card = await tx.card.findFirst({
          where: {
            id: parsed.data.cardId,
            boardId: parsed.data.boardId,
          },
          select: { id: true },
        });
        if (card) {
          await tx.cardLabel.create({
            data: { cardId: card.id, labelId: label.id },
          });
        }
      }

      return label;
    });

    const view = mapBoardLabelRow(created);
    if (!view) {
      return { ok: false, error: errors.createLabel };
    }

    await revalidateBoardPath(parsed.data.boardId);
    return { ok: true, data: view };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    if (error instanceof Error && error.message === "LABEL_LIMIT") {
      return { ok: false, error: errors.labelLimit };
    }
    if (error instanceof Error && error.message === "LABEL_EXISTS") {
      return { ok: false, error: errors.labelExists };
    }
    if (isUniqueConstraintError(error)) {
      return { ok: false, error: errors.labelExists };
    }
    logger.error("createBoardLabelAction failed", error);
    return { ok: false, error: errors.createLabel };
  }
}

export async function setCardLabelAction(
  formData: FormData,
): Promise<ActionResult<{ assigned: boolean }>> {
  const errors = await tErrors();
  const parsed = setCardLabelSchema.safeParse({
    boardId: formData.get("boardId"),
    cardId: formData.get("cardId"),
    labelId: formData.get("labelId"),
    assigned: formData.get("assigned"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  try {
    await requireBoardAccess(parsed.data.boardId);
    const [card, label] = await Promise.all([
      prisma.card.findFirst({
        where: { id: parsed.data.cardId, boardId: parsed.data.boardId },
        select: { id: true },
      }),
      prisma.boardLabel.findFirst({
        where: { id: parsed.data.labelId, boardId: parsed.data.boardId },
        select: { id: true },
      }),
    ]);
    if (!card) {
      return { ok: false, error: errors.cardNotFound };
    }
    if (!label) {
      return { ok: false, error: errors.labelNotFound };
    }

    if (parsed.data.assigned) {
      await prisma.cardLabel.upsert({
        where: {
          cardId_labelId: { cardId: card.id, labelId: label.id },
        },
        create: { cardId: card.id, labelId: label.id },
        update: {},
      });
    } else {
      await prisma.cardLabel.deleteMany({
        where: { cardId: card.id, labelId: label.id },
      });
    }

    await revalidateBoardPath(parsed.data.boardId);
    return { ok: true, data: { assigned: parsed.data.assigned } };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    logger.error("setCardLabelAction failed", error);
    return { ok: false, error: errors.updateCard };
  }
}

export async function setBoardLabelColorAction(
  formData: FormData,
): Promise<ActionResult<BoardLabelView>> {
  const errors = await tErrors();
  const parsed = setBoardLabelColorSchema.safeParse({
    boardId: formData.get("boardId"),
    labelId: formData.get("labelId"),
    color: formData.get("color"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  try {
    await requireBoardAccess(parsed.data.boardId);
    const label = await prisma.boardLabel.findFirst({
      where: { id: parsed.data.labelId, boardId: parsed.data.boardId },
    });
    if (!label) {
      return { ok: false, error: errors.labelNotFound };
    }

    const updated = await prisma.boardLabel.update({
      where: { id: label.id },
      data: { color: parsed.data.color },
    });
    const view = mapBoardLabelRow(updated);
    if (!view) {
      return { ok: false, error: errors.updateLabel };
    }

    await revalidateBoardPath(parsed.data.boardId);
    return { ok: true, data: view };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    logger.error("setBoardLabelColorAction failed", error);
    return { ok: false, error: errors.updateLabel };
  }
}

/** Renames a board label. Duplicate names on the same board are rejected. */
export async function renameBoardLabelAction(
  formData: FormData,
): Promise<ActionResult<BoardLabelView>> {
  const errors = await tErrors();
  const parsed = renameBoardLabelSchema.safeParse({
    boardId: formData.get("boardId"),
    labelId: formData.get("labelId"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  const name = normalizeLabelName(parsed.data.name);
  if (!name) {
    return { ok: false, error: errors.validation };
  }

  try {
    await requireBoardAccess(parsed.data.boardId);
    const existing = await prisma.boardLabel.findMany({
      where: { boardId: parsed.data.boardId },
      select: { id: true, name: true },
    });
    const current = existing.find((label) => label.id === parsed.data.labelId);
    if (!current) {
      return { ok: false, error: errors.labelNotFound };
    }
    if (
      existing.some(
        (label) =>
          label.id !== parsed.data.labelId && namesMatch(label.name, name),
      )
    ) {
      return { ok: false, error: errors.labelExists };
    }

    const updated = await prisma.boardLabel.update({
      where: { id: current.id },
      data: { name },
    });
    const view = mapBoardLabelRow(updated);
    if (!view) {
      return { ok: false, error: errors.updateLabel };
    }

    await revalidateBoardPath(parsed.data.boardId);
    return { ok: true, data: view };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    if (isUniqueConstraintError(error)) {
      return { ok: false, error: errors.labelExists };
    }
    logger.error("renameBoardLabelAction failed", error);
    return { ok: false, error: errors.updateLabel };
  }
}

export async function deleteBoardLabelAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const parsed = deleteBoardLabelSchema.safeParse({
    boardId: formData.get("boardId"),
    labelId: formData.get("labelId"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  try {
    await requireBoardAccess(parsed.data.boardId);
    const deleted = await prisma.boardLabel.deleteMany({
      where: { id: parsed.data.labelId, boardId: parsed.data.boardId },
    });
    if (deleted.count !== 1) {
      return { ok: false, error: errors.labelNotFound };
    }

    await revalidateBoardPath(parsed.data.boardId);
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    logger.error("deleteBoardLabelAction failed", error);
    return { ok: false, error: errors.deleteLabel };
  }
}
