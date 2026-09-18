import type { CardStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { afterCardCursor } from "@/lib/board-card-view";
import {
  CARD_QUERY_MAX_IDS,
  CARD_SEARCH_MAX_LENGTH,
  MAX_BOARD_LABELS,
  MAX_BOARD_PARTICIPANTS,
} from "@/lib/constants";
import {
  emptyCardListQuery,
  type CardListQuery,
} from "@/lib/card-query";

function parseFlag(value: string | null): boolean {
  return value === "1" || value === "true";
}

function parseIsoDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time) : null;
}

function parseCuidList(values: string[], max: number): string[] | null {
  if (values.length > max) {
    return null;
  }
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (!z.string().cuid().safeParse(value).success) {
      return null;
    }
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    unique.push(value);
  }
  return unique;
}

/** `null` means the request is malformed. */
export function parseCardListQuery(
  params: URLSearchParams,
): CardListQuery | null {
  const rawText = params.get("q") ?? "";
  if (rawText.length > CARD_SEARCH_MAX_LENGTH) {
    return null;
  }
  const labelIds = parseCuidList(params.getAll("label"), MAX_BOARD_LABELS);
  const authorIds = parseCuidList(
    params.getAll("author"),
    MAX_BOARD_PARTICIPANTS,
  );
  const cardIds = parseCuidList(params.getAll("cardId"), CARD_QUERY_MAX_IDS);
  if (!labelIds || !authorIds || !cardIds) {
    return null;
  }

  const createdFrom = parseIsoDate(params.get("createdFrom"));
  const createdTo = parseIsoDate(params.get("createdTo"));
  if (params.get("createdFrom") && !createdFrom) {
    return null;
  }
  if (params.get("createdTo") && !createdTo) {
    return null;
  }
  if (createdFrom && createdTo && createdFrom.getTime() > createdTo.getTime()) {
    return null;
  }

  return {
    ...emptyCardListQuery(),
    text: rawText.trim(),
    labelIds,
    unlabeled: parseFlag(params.get("unlabeled")),
    authorIds,
    createdFrom,
    createdTo,
    urgent: parseFlag(params.get("urgent")),
    hasFile: parseFlag(params.get("hasFile")),
    cardIds: params.has("cardId") ? cardIds : null,
  };
}

export function cardListWhere(
  boardId: string,
  status: CardStatus,
  query: CardListQuery,
  cursor?: { position: number; id: string } | null,
): Prisma.CardWhereInput {
  const clauses: Prisma.CardWhereInput[] = [{ boardId }, { status }];
  if (cursor) {
    clauses.push(afterCardCursor(cursor));
  }
  if (query.text.length > 0) {
    clauses.push({
      OR: [
        { title: { contains: query.text, mode: "insensitive" } },
        {
          author: {
            displayName: { contains: query.text, mode: "insensitive" },
          },
        },
        {
          labels: {
            some: {
              label: { name: { contains: query.text, mode: "insensitive" } },
            },
          },
        },
      ],
    });
  }

  const labelClauses: Prisma.CardWhereInput[] = [];
  if (query.labelIds.length > 0) {
    labelClauses.push({
      labels: { some: { labelId: { in: query.labelIds } } },
    });
  }
  if (query.unlabeled) {
    labelClauses.push({ labels: { none: {} } });
  }
  if (labelClauses.length === 1 && labelClauses[0]) {
    clauses.push(labelClauses[0]);
  } else if (labelClauses.length > 1) {
    clauses.push({ OR: labelClauses });
  }

  if (query.authorIds.length > 0) {
    clauses.push({ authorId: { in: query.authorIds } });
  }
  if (query.createdFrom) {
    clauses.push({ createdAt: { gte: query.createdFrom } });
  }
  if (query.createdTo) {
    clauses.push({ createdAt: { lte: query.createdTo } });
  }
  if (query.urgent) {
    clauses.push({ urgent: true });
  }
  if (query.hasFile) {
    clauses.push({ attachments: { some: { commentId: null } } });
  }
  if (query.cardIds) {
    clauses.push({ id: { in: query.cardIds } });
  }

  return { AND: clauses };
}

export type CardQueryMatchable = {
  id: string;
  title: string;
  urgent: boolean;
  createdAt: Date | string;
  attachmentCount: number;
  author: { id?: string; displayName: string };
  labels?: ReadonlyArray<{ id?: string; name: string }>;
};

export function cardMatchesListQuery(
  card: CardQueryMatchable,
  query: CardListQuery,
): boolean {
  if (query.cardIds && !query.cardIds.includes(card.id)) {
    return false;
  }
  if (query.urgent && !card.urgent) {
    return false;
  }
  if (query.hasFile && card.attachmentCount <= 0) {
    return false;
  }
  if (
    query.authorIds.length > 0 &&
    (!card.author.id || !query.authorIds.includes(card.author.id))
  ) {
    return false;
  }
  const labels = card.labels ?? [];
  const wantsLabel = query.labelIds.length > 0 || query.unlabeled;
  if (wantsLabel) {
    const labelHit = labels.some(
      (label) => label.id && query.labelIds.includes(label.id),
    );
    const unlabeledHit = query.unlabeled && labels.length === 0;
    if (!labelHit && !unlabeledHit) {
      return false;
    }
  }
  const created = new Date(card.createdAt).getTime();
  if (query.createdFrom && created < query.createdFrom.getTime()) {
    return false;
  }
  if (query.createdTo && created > query.createdTo.getTime()) {
    return false;
  }
  if (query.text.length === 0) {
    return true;
  }
  const needle = query.text.toLowerCase();
  return (
    card.title.toLowerCase().includes(needle) ||
    card.author.displayName.toLowerCase().includes(needle) ||
    labels.some((label) => label.name.toLowerCase().includes(needle))
  );
}
