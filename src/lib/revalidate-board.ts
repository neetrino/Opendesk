import { revalidatePath } from "next/cache";
import { buildJoinPath } from "@/lib/join-url";
import { prisma } from "@/lib/prisma";

/** Revalidate the canonical board URL `/b/{slug}/{joinToken}`. */
export async function revalidateBoardPath(boardId: string): Promise<void> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { slug: true, joinToken: true },
  });
  if (!board) {
    return;
  }
  revalidatePath(buildJoinPath(board.slug, board.joinToken));
}
