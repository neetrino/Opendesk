"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { decideDisableUser, decideRoleChange } from "@/lib/account-link";
import { requireAccount } from "@/lib/account-session";
import { hasPermission } from "@/lib/platform-permissions";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

const userIdSchema = z.object({
  userId: z.string().cuid(),
});

const disableUserSchema = userIdSchema.extend({
  disabled: z.enum(["true", "false"]),
});

const roleSchema = userIdSchema.extend({
  role: z.enum(["member", "platform_admin"]),
});

const boardSchema = z.object({
  boardId: z.string().cuid(),
  disabled: z.enum(["true", "false"]),
});

async function requireAdmin(permission: "admin.users.disable" | "admin.users.setRole" | "admin.boards.disable") {
  const account = await requireAccount();
  if (!hasPermission(account.role, permission)) {
    throw new Error("FORBIDDEN");
  }
  return account;
}

function adminRedirect(notice?: string): never {
  revalidatePath("/admin");
  redirect(notice ? `/admin?notice=${notice}` : "/admin");
}

export async function setUserDisabledAction(formData: FormData): Promise<void> {
  const account = await requireAdmin("admin.users.disable");
  const parsed = disableUserSchema.safeParse({
    userId: formData.get("userId"),
    disabled: formData.get("disabled"),
  });
  if (!parsed.success) {
    adminRedirect("invalid");
  }

  const disable = parsed.data.disabled === "true";
  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, role: true, disabledAt: true },
  });
  if (!target) {
    adminRedirect("invalid");
  }

  const otherActiveAdminCount = await prisma.user.count({
    where: {
      role: "platform_admin",
      disabledAt: null,
      id: { not: target.id },
    },
  });
  const decision = decideDisableUser({
    targetRole: target.role,
    disable,
    otherActiveAdminCount,
  });
  if (decision === "last_admin") {
    adminRedirect("lastAdmin");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: target.id },
      data: disable
        ? { disabledAt: new Date(), sessionVersion: { increment: 1 } }
        : { disabledAt: null },
    });
    await tx.adminAudit.create({
      data: {
        actorId: account.id,
        action: disable ? "user.disable" : "user.enable",
        targetType: "user",
        targetId: target.id,
      },
    });
  });

  adminRedirect();
}

export async function setUserRoleAction(formData: FormData): Promise<void> {
  const account = await requireAdmin("admin.users.setRole");
  const parsed = roleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    adminRedirect("invalid");
  }

  const nextRole = parsed.data.role as UserRole;
  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, role: true, disabledAt: true },
  });
  if (!target || target.role === nextRole) {
    adminRedirect(target ? undefined : "invalid");
  }

  const otherActiveAdminCount = await prisma.user.count({
    where: {
      role: "platform_admin",
      disabledAt: null,
      id: { not: target.id },
    },
  });
  const decision = decideRoleChange({
    actorId: account.id,
    targetId: target.id,
    targetDisabled: Boolean(target.disabledAt),
    targetRole: target.role,
    nextRole,
    otherActiveAdminCount,
  });
  if (decision !== "ok") {
    adminRedirect(decision === "last_admin" ? "lastAdmin" : "roleDenied");
  }

  await prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: { id: target.id, role: target.role },
      data: { role: nextRole, sessionVersion: { increment: 1 } },
    });
    if (updated.count !== 1) {
      return;
    }
    if (nextRole !== "platform_admin") {
      const remaining = await tx.user.count({
        where: { role: "platform_admin", disabledAt: null },
      });
      if (remaining < 1) {
        throw new Error("LAST_ADMIN");
      }
    }
    await tx.adminAudit.create({
      data: {
        actorId: account.id,
        action: nextRole === "platform_admin" ? "user.grant_admin" : "user.revoke_admin",
        targetType: "user",
        targetId: target.id,
      },
    });
  }).catch((error: unknown) => {
    if (error instanceof Error && error.message === "LAST_ADMIN") {
      adminRedirect("lastAdmin");
    }
    throw error;
  });

  adminRedirect();
}

export async function setBoardDisabledAction(formData: FormData): Promise<void> {
  const account = await requireAdmin("admin.boards.disable");
  const parsed = boardSchema.safeParse({
    boardId: formData.get("boardId"),
    disabled: formData.get("disabled"),
  });
  if (!parsed.success) {
    adminRedirect("invalid");
  }

  const disable = parsed.data.disabled === "true";
  const board = await prisma.board.findUnique({
    where: { id: parsed.data.boardId },
    select: { id: true },
  });
  if (!board) {
    adminRedirect("invalid");
  }

  await prisma.$transaction(async (tx) => {
    await tx.board.update({
      where: { id: board.id },
      data: { disabledAt: disable ? new Date() : null },
    });
    await tx.adminAudit.create({
      data: {
        actorId: account.id,
        action: disable ? "board.disable" : "board.enable",
        targetType: "board",
        targetId: board.id,
      },
    });
  });

  adminRedirect();
}
