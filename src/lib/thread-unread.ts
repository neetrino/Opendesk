export function findFirstUnreadCommentId(
  comments: Array<{ id: string; authorId: string; createdAt: Date }>,
  lastReadAt: Date | null,
  currentUserId: string,
): string | null {
  if (!lastReadAt) {
    return null;
  }
  const lastReadTime = lastReadAt.getTime();
  if (!Number.isFinite(lastReadTime)) {
    return null;
  }
  const unread = comments.find((comment) => {
    if (comment.authorId === currentUserId) {
      return false;
    }
    return comment.createdAt.getTime() > lastReadTime;
  });
  return unread?.id ?? null;
}
