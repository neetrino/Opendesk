import type { Metadata } from "next";
import { buildBoardManifestPath } from "@/lib/web-app-manifest";
import { prisma } from "@/lib/prisma";

type BoardSegmentLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ boardId: string; joinToken: string }>;
};

export async function generateMetadata({
  params,
}: BoardSegmentLayoutProps): Promise<Metadata> {
  const { boardId: boardSlug, joinToken } = await params;
  const board = await prisma.board.findUnique({
    where: { joinToken },
    select: { title: true, slug: true },
  });

  if (!board || board.slug !== boardSlug) {
    return { title: "OpenDesk" };
  }

  return {
    title: `${board.title} · OpenDesk`,
    manifest: buildBoardManifestPath(board.slug, joinToken),
    appleWebApp: {
      capable: true,
      title: board.title,
      statusBarStyle: "black-translucent",
    },
  };
}

export default function BoardSegmentLayout({
  children,
}: BoardSegmentLayoutProps) {
  return children;
}
