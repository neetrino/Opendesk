import { NextResponse } from "next/server";
import { buildJoinPath } from "@/lib/join-url";
import { buildWebAppManifest } from "@/lib/web-app-manifest";
import { prisma } from "@/lib/prisma";

type BoardManifestRouteProps = {
  params: Promise<{ boardId: string; joinToken: string }>;
};

/**
 * Board-scoped install manifest so Add to Home Screen opens this join URL.
 */
export async function GET(
  _request: Request,
  { params }: BoardManifestRouteProps,
): Promise<NextResponse> {
  const { boardId: boardSlug, joinToken } = await params;
  const board = await prisma.board.findUnique({
    where: { joinToken },
    select: { title: true, slug: true },
  });

  if (!board || board.slug !== boardSlug) {
    return new NextResponse("Not found", { status: 404 });
  }

  const manifest = buildWebAppManifest({
    startUrl: buildJoinPath(board.slug, joinToken),
    name: board.title,
  });

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
