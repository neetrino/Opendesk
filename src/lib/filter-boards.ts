export type BoardSearchable = {
  title: string;
  slug: string;
};

/** Case-insensitive match on board title or slug. Empty query returns every board. */
export function filterBoardsByQuery<T extends BoardSearchable>(
  boards: readonly T[],
  query: string,
): T[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return [...boards];
  }

  return boards.filter(
    (board) =>
      board.title.toLowerCase().includes(needle) ||
      board.slug.toLowerCase().includes(needle),
  );
}
