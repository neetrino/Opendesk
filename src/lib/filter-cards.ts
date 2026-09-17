export type CardSearchable = {
  title: string;
  author: { displayName: string };
  labels?: ReadonlyArray<{ name: string }>;
};

/** Case-insensitive match on card title, author, or label. Empty query returns every card. */
export function filterCardsByQuery<T extends CardSearchable>(
  cards: readonly T[],
  query: string,
): T[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return [...cards];
  }

  return cards.filter(
    (card) =>
      card.title.toLowerCase().includes(needle) ||
      card.author.displayName.toLowerCase().includes(needle) ||
      (card.labels ?? []).some((label) =>
        label.name.toLowerCase().includes(needle),
      ),
  );
}
