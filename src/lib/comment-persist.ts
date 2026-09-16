import type { Prisma } from "@prisma/client";
import { commentExcerpt } from "@/lib/comment-excerpt";
import { uniqueMentionedParticipants } from "@/lib/comment-mentions";

type MentionTx = {
  commentMention: {
    deleteMany: (args: Prisma.CommentMentionDeleteManyArgs) => Promise<unknown>;
    createMany: (args: Prisma.CommentMentionCreateManyArgs) => Promise<unknown>;
  };
};

export async function replaceCommentMentions(
  tx: MentionTx,
  commentId: string,
  body: string,
  participants: Array<{ id: string; displayName: string }>,
): Promise<void> {
  const mentioned = uniqueMentionedParticipants(body, participants);
  await tx.commentMention.deleteMany({ where: { commentId } });
  if (mentioned.length === 0) {
    return;
  }
  await tx.commentMention.createMany({
    data: mentioned.map((participant) => ({
      commentId,
      participantId: participant.id,
    })),
  });
}

export function replySnapshot(parent: {
  id: string;
  body: string;
  deletedAt: Date | null;
  parentAuthorName: string | null;
  parentExcerpt: string | null;
  author: { displayName: string };
}): {
  parentId: string;
  parentAuthorName: string;
  parentExcerpt: string;
} {
  if (parent.deletedAt) {
    return {
      parentId: parent.id,
      parentAuthorName: parent.parentAuthorName ?? parent.author.displayName,
      parentExcerpt: parent.parentExcerpt ?? "",
    };
  }
  return {
    parentId: parent.id,
    parentAuthorName: parent.author.displayName,
    parentExcerpt: commentExcerpt(parent.body),
  };
}
