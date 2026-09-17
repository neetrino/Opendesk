import {
  LABEL_COLOR_KEYS,
  MAX_BOARD_LABELS,
  MAX_LABEL_NAME_LENGTH,
} from "@/lib/constants";

export type LabelColorKey = (typeof LABEL_COLOR_KEYS)[number];

export type BoardLabelView = {
  id: string;
  name: string;
  color: LabelColorKey;
  position: number;
};

export const OPTIMISTIC_LABEL_ID_PREFIX = "optimistic-label-";

export type LabelCatalogChange = (
  next:
    | readonly BoardLabelView[]
    | ((current: readonly BoardLabelView[]) => readonly BoardLabelView[]),
) => void;

export function isOptimisticLabelId(labelId: string): boolean {
  return labelId.startsWith(OPTIMISTIC_LABEL_ID_PREFIX);
}

/** Accent-insensitive name compare used for duplicate label checks. */
export function namesMatch(left: string, right: string): boolean {
  return left.localeCompare(right, undefined, { sensitivity: "accent" }) === 0;
}

export function isLabelColorKey(value: string): value is LabelColorKey {
  return (LABEL_COLOR_KEYS as readonly string[]).includes(value);
}

export function parseLabelColor(value: string): LabelColorKey | null {
  return isLabelColorKey(value) ? value : null;
}

/** First unused palette color, then wrap so a new label always has a color. */
export function nextLabelColor(
  used: readonly LabelColorKey[],
): LabelColorKey {
  const taken = new Set(used);
  const unused = LABEL_COLOR_KEYS.find((color) => !taken.has(color));
  if (unused) {
    return unused;
  }
  return LABEL_COLOR_KEYS[used.length % LABEL_COLOR_KEYS.length] ?? "teal";
}

export function cycleLabelColor(current: LabelColorKey): LabelColorKey {
  const index = LABEL_COLOR_KEYS.indexOf(current);
  const nextIndex = index < 0 ? 0 : (index + 1) % LABEL_COLOR_KEYS.length;
  return LABEL_COLOR_KEYS[nextIndex] ?? "teal";
}

export function normalizeLabelName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_LABEL_NAME_LENGTH);
}

export function sameLabelIds(
  left: readonly { id: string }[],
  right: readonly { id: string }[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const rightIds = new Set(right.map((item) => item.id));
  return left.every((item) => rightIds.has(item.id));
}

export function sortBoardLabels(
  labels: readonly BoardLabelView[],
): BoardLabelView[] {
  return [...labels].sort((left, right) => {
    if (left.position !== right.position) {
      return left.position - right.position;
    }
    return left.name.localeCompare(right.name);
  });
}

export function toggleCardLabels(
  labels: readonly BoardLabelView[],
  label: BoardLabelView,
): BoardLabelView[] {
  if (labels.some((item) => item.id === label.id)) {
    return labels.filter((item) => item.id !== label.id);
  }
  return sortBoardLabels([...labels, label]);
}

export function replaceBoardLabel(
  labels: readonly BoardLabelView[],
  next: BoardLabelView,
): BoardLabelView[] {
  return sortBoardLabels(
    labels.map((label) => (label.id === next.id ? next : label)),
  );
}

/** Returns the catalog with `label` appended, or null when it would exceed the limit or duplicate a name. */
export function addOptimisticBoardLabel(
  labels: readonly BoardLabelView[],
  label: BoardLabelView,
): BoardLabelView[] | null {
  if (labels.length >= MAX_BOARD_LABELS) {
    return null;
  }
  if (labels.some((item) => namesMatch(item.name, label.name))) {
    return null;
  }
  return sortBoardLabels([...labels, label]);
}

/** Replaces a temp label id with the saved row while keeping any local name/color edits. */
export function confirmOptimisticLabel(
  labels: readonly BoardLabelView[],
  tempId: string,
  saved: BoardLabelView,
): BoardLabelView[] {
  return sortBoardLabels(
    labels.map((label) =>
      label.id === tempId
        ? { ...saved, name: label.name, color: label.color }
        : label,
    ),
  );
}

export function optimisticLabelIdRemap(
  previous: readonly BoardLabelView[],
  next: readonly BoardLabelView[],
): Map<string, string> {
  const nextIds = new Set(next.map((label) => label.id));
  const previousIds = new Set(previous.map((label) => label.id));
  const removed = previous.filter(
    (label) => isOptimisticLabelId(label.id) && !nextIds.has(label.id),
  );
  const added = next.filter(
    (label) => !isOptimisticLabelId(label.id) && !previousIds.has(label.id),
  );
  const remap = new Map<string, string>();
  if (removed.length === 1 && added.length === 1) {
    const from = removed[0];
    const to = added[0];
    if (from && to) {
      remap.set(from.id, to.id);
    }
  }
  return remap;
}

/** Joins card assignments to the current board catalog (name, color, dropped ids). */
export function resolveCardLabels(
  assigned: readonly BoardLabelView[],
  catalog: readonly BoardLabelView[],
): BoardLabelView[] {
  const byId = new Map(catalog.map((label) => [label.id, label]));
  return sortBoardLabels(
    assigned.flatMap((label) => {
      const current = byId.get(label.id);
      return current ? [current] : [];
    }),
  );
}

export function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
