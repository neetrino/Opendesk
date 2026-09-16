export type QuestionCandidate = {
  id: string;
  authorName: string;
  excerpt: string;
};

export function selectOpenQuestions<
  T extends { id: string; hasQuestion: boolean; deleted: boolean },
>(
  comments: T[],
  replies: Array<{ parentId: string | null; deleted: boolean }>,
): T[] {
  const closed = new Set(
    replies
      .filter((reply) => reply.parentId && !reply.deleted)
      .map((reply) => reply.parentId as string),
  );
  return comments.filter(
    (comment) =>
      !comment.deleted && comment.hasQuestion && !closed.has(comment.id),
  );
}

export function toQuestionPreview(
  comment: { id: string; authorName: string; excerpt: string },
): QuestionCandidate {
  return {
    id: comment.id,
    authorName: comment.authorName,
    excerpt: comment.excerpt,
  };
}

export type QuestionSyncComment = {
  id: string;
  deleted: boolean;
  authorName: string;
  excerpt: string;
  hasQuestion: boolean;
  replyToId: string | null;
};

/**
 * Keep server-known questions that are not in the loaded window,
 * then apply local evidence: new question, reply, or delete.
 */
export function mergeOpenQuestions(
  current: QuestionCandidate[],
  comments: QuestionSyncComment[],
): QuestionCandidate[] {
  const closed = new Set(
    comments
      .filter((comment) => comment.replyToId && !comment.deleted)
      .map((comment) => comment.replyToId as string),
  );
  const next = new Map(current.map((item) => [item.id, item]));

  for (const comment of comments) {
    const isOpen =
      !comment.deleted && comment.hasQuestion && !closed.has(comment.id);
    if (isOpen) {
      next.set(comment.id, {
        id: comment.id,
        authorName: comment.authorName,
        excerpt: comment.excerpt || next.get(comment.id)?.excerpt || "",
      });
      continue;
    }
    if (next.has(comment.id)) {
      next.delete(comment.id);
    }
  }

  return [...next.values()];
}
