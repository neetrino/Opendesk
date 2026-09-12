/**
 * Keep one extra row so the caller can set a next cursor without a count query.
 */
export function sliceLoadedPage<T>(rows: T[], pageSize: number): {
  items: T[];
  hasMore: boolean;
} {
  const hasMore = rows.length > pageSize;
  return {
    items: hasMore ? rows.slice(0, pageSize) : rows,
    hasMore,
  };
}

export function toIsoDate(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
