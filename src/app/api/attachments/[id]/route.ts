import { NextResponse } from "next/server";
import { requireBoardAccess } from "@/lib/board-access";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { createAttachmentDownloadUrl, isR2Configured } from "@/lib/r2";

type AttachmentRouteContext = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: AttachmentRouteContext,
): Promise<Response> {
  if (!isR2Configured()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const attachment = await prisma.attachment.findUnique({
    where: { id },
    select: {
      boardId: true,
      objectKey: true,
      filename: true,
      contentType: true,
    },
  });

  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await requireBoardAccess(attachment.boardId);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = await createAttachmentDownloadUrl(
      attachment.objectKey,
      attachment.filename,
      attachment.contentType,
    );
    return NextResponse.redirect(url, 302);
  } catch (error) {
    logger.error("attachment download failed", error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
