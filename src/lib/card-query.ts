import {
  CARD_QUERY_MAX_IDS,
  CARD_SEARCH_MAX_LENGTH,
} from "@/lib/constants";

export type AttentionFilter = "unread" | "new";
export type PeriodPreset = "today" | "last5" | "custom";
export type FilterChipKey =
  | "label"
  | "author"
  | "period"
  | "inbox"
  | "urgent"
  | "hasFile";

export type BoardCardFilters = {
  labelIds: string[];
  unlabeled: boolean;
  authorIds: string[];
  period: PeriodPreset | null;
  customFrom: string;
  customTo: string;
  attention: AttentionFilter[];
  urgent: boolean;
  hasFile: boolean;
};

export type FilterChip = {
  key: FilterChipKey;
  count: number | null;
};

/** Resolved list query sent to `/cards` and used to match local cards. */
export type CardListQuery = {
  text: string;
  labelIds: string[];
  unlabeled: boolean;
  authorIds: string[];
  createdFrom: Date | null;
  createdTo: Date | null;
  urgent: boolean;
  hasFile: boolean;
  /** `null` = no inbox constraint. Empty = match nothing. */
  cardIds: string[] | null;
};

export const EMPTY_BOARD_FILTERS: BoardCardFilters = {
  labelIds: [],
  unlabeled: false,
  authorIds: [],
  period: null,
  customFrom: "",
  customTo: "",
  attention: [],
  urgent: false,
  hasFile: false,
};

export function cloneBoardFilters(
  filters: BoardCardFilters,
): BoardCardFilters {
  return {
    labelIds: [...filters.labelIds],
    unlabeled: filters.unlabeled,
    authorIds: [...filters.authorIds],
    period: filters.period,
    customFrom: filters.customFrom,
    customTo: filters.customTo,
    attention: [...filters.attention],
    urgent: filters.urgent,
    hasFile: filters.hasFile,
  };
}

export function boardFiltersAreEmpty(filters: BoardCardFilters): boolean {
  return (
    filters.labelIds.length === 0 &&
    !filters.unlabeled &&
    filters.authorIds.length === 0 &&
    filters.period === null &&
    filters.attention.length === 0 &&
    !filters.urgent &&
    !filters.hasFile
  );
}

export function boardFilterChips(filters: BoardCardFilters): FilterChip[] {
  const chips: FilterChip[] = [];
  const labelCount = filters.labelIds.length + (filters.unlabeled ? 1 : 0);
  if (labelCount > 0) {
    chips.push({ key: "label", count: labelCount });
  }
  if (filters.authorIds.length > 0) {
    chips.push({ key: "author", count: filters.authorIds.length });
  }
  if (filters.period !== null) {
    chips.push({ key: "period", count: null });
  }
  if (filters.attention.length > 0) {
    chips.push({ key: "inbox", count: filters.attention.length });
  }
  if (filters.urgent) {
    chips.push({ key: "urgent", count: null });
  }
  if (filters.hasFile) {
    chips.push({ key: "hasFile", count: null });
  }
  return chips;
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfLocalDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

export function parseLocalDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function resolvePeriodRange(
  filters: BoardCardFilters,
  now = new Date(),
): { from: Date; to: Date } | null {
  if (filters.period === "today") {
    return { from: startOfLocalDay(now), to: endOfLocalDay(now) };
  }
  if (filters.period === "last5") {
    const from = startOfLocalDay(now);
    from.setDate(from.getDate() - 4);
    return { from, to: endOfLocalDay(now) };
  }
  if (filters.period === "custom") {
    const from = parseLocalDateInput(filters.customFrom);
    const to = parseLocalDateInput(filters.customTo);
    if (!from || !to) {
      return null;
    }
    return { from: startOfLocalDay(from), to: endOfLocalDay(to) };
  }
  return null;
}

export function customPeriodIsValid(filters: BoardCardFilters): boolean {
  if (filters.period !== "custom") {
    return true;
  }
  const range = resolvePeriodRange(filters);
  return range !== null && range.from.getTime() <= range.to.getTime();
}

export function emptyCardListQuery(): CardListQuery {
  return {
    text: "",
    labelIds: [],
    unlabeled: false,
    authorIds: [],
    createdFrom: null,
    createdTo: null,
    urgent: false,
    hasFile: false,
    cardIds: null,
  };
}

export function cardListQueryIsActive(query: CardListQuery): boolean {
  return (
    query.text.length > 0 ||
    query.labelIds.length > 0 ||
    query.unlabeled ||
    query.authorIds.length > 0 ||
    query.createdFrom !== null ||
    query.createdTo !== null ||
    query.urgent ||
    query.hasFile ||
    query.cardIds !== null
  );
}

export function buildCardListQuery(
  text: string,
  filters: BoardCardFilters,
  cardIds: string[] | null,
): CardListQuery {
  const range = resolvePeriodRange(filters);
  return {
    text: text.trim().slice(0, CARD_SEARCH_MAX_LENGTH),
    labelIds: filters.labelIds,
    unlabeled: filters.unlabeled,
    authorIds: filters.authorIds,
    createdFrom: range?.from ?? null,
    createdTo: range?.to ?? null,
    urgent: filters.urgent,
    hasFile: filters.hasFile,
    cardIds,
  };
}

export function cardListQueryKey(query: CardListQuery): string {
  return JSON.stringify({
    text: query.text,
    labelIds: query.labelIds,
    unlabeled: query.unlabeled,
    authorIds: query.authorIds,
    createdFrom: query.createdFrom?.toISOString() ?? null,
    createdTo: query.createdTo?.toISOString() ?? null,
    urgent: query.urgent,
    hasFile: query.hasFile,
    cardIds: query.cardIds,
  });
}

export function cardListQuerySearchParams(
  query: CardListQuery,
): URLSearchParams {
  const params = new URLSearchParams();
  if (query.text.length > 0) {
    params.set("q", query.text);
  }
  for (const id of query.labelIds) {
    params.append("label", id);
  }
  if (query.unlabeled) {
    params.set("unlabeled", "1");
  }
  for (const id of query.authorIds) {
    params.append("author", id);
  }
  if (query.createdFrom) {
    params.set("createdFrom", query.createdFrom.toISOString());
  }
  if (query.createdTo) {
    params.set("createdTo", query.createdTo.toISOString());
  }
  if (query.urgent) {
    params.set("urgent", "1");
  }
  if (query.hasFile) {
    params.set("hasFile", "1");
  }
  if (query.cardIds) {
    for (const id of query.cardIds.slice(0, CARD_QUERY_MAX_IDS)) {
      params.append("cardId", id);
    }
  }
  return params;
}
