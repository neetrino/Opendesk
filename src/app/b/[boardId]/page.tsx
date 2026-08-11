import { redirect } from "next/navigation";
import { canAccessBoard } from "@/lib/board-access";
import { buildJoinPath } from "@/lib/join-url";
import { prisma } from "@/lib/prisma";

type LegacyBoardPageProps = {
  params: Promise<{ boardId: string }>;
};

/**
 * Legacy `/b/{cuid}` → canonical `/b/{slug}/{joinToken}` when accessible.
 */
export default async function LegacyBoardPage({ params }: LegacyBoardPageProps) {
  const { boardId } = await params;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { id: true, slug: true, joinToken: true },
  });

  if (!board) {
    redirect("/");
  }

  const allowed = await canAccessBoard(board.id);
  if (!allowed) {
    redirect("/");
  }

  redirect(buildJoinPath(board.slug, board.joinToken));
}
