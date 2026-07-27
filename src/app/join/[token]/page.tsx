import { notFound, redirect } from "next/navigation";
import { buildJoinPath } from "@/lib/join-url";
import { prisma } from "@/lib/prisma";

type LegacyJoinPageProps = {
  params: Promise<{ token: string }>;
};

/** Legacy `/join/:token` → `/b/{slug}/{token}` */
export default async function LegacyJoinPage({ params }: LegacyJoinPageProps) {
  const { token } = await params;
  const board = await prisma.board.findUnique({
    where: { joinToken: token },
    select: { slug: true },
  });

  if (!board) {
    notFound();
  }

  redirect(buildJoinPath(board.slug, token));
}
