import { NextResponse } from "next/server";
import { z } from "zod";
import { loadBoardExport } from "@/lib/board-export";
import {
  boardExportFilename,
  formatBoardExport,
} from "@/lib/board-export-format";
import { requireBoardAccess } from "@/lib/board-access";
import { logger } from "@/lib/logger";

const boardIdSchema = z.string().cuid();

type BoardExportRouteContext = {
  params: Promise<{ boardId: string }>;
};

export const runtime = "nodejs";

/**
 * Owner-only Markdown snapshot of every task, label, and chat on one board.
 */
export async function GET(
  _request: Request,
  context: BoardExportRouteContext,
): Promise<Response> {
  const { boardId } = await context.params;
  const parsedId = boardIdSchema.safeParse(boardId);
  if (!parsedId.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const access = await requireBoardAccess(parsedId.data);
    if (!access.isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await loadBoardExport(parsedId.data);
    if (!snapshot) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return new NextResponse(formatBoardExport(snapshot), {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "private, no-store",
        "Content-Disposition": contentDisposition(
          boardExportFilename(snapshot.title),
        ),
      },
    });
  } catch (error) {
    logger.error("board export failed", error);
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}

function contentDisposition(filename: string): string {
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="opendesk-board.md"; filename*=UTF-8''${encoded}`;
}
