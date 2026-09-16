export type ThreadDayCopy = {
  today: string;
  yesterday: string;
};

export type ThreadDayBreak = {
  type: "day";
  key: string;
  label: string;
};

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function dayKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatThreadDayLabel(
  createdAt: Date,
  locale: string,
  now: Date,
  copy: ThreadDayCopy,
): string {
  const createdDay = startOfDay(createdAt).getTime();
  const today = startOfDay(now).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  if (createdDay === today) {
    return copy.today;
  }
  if (createdDay === today - dayMs) {
    return copy.yesterday;
  }
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year:
      createdAt.getFullYear() === now.getFullYear() ? undefined : "numeric",
  }).format(createdAt);
}

export function dayBreakForComment(
  createdAt: Date,
  previousCreatedAt: Date | null,
  locale: string,
  now: Date,
  copy: ThreadDayCopy,
): ThreadDayBreak | null {
  const key = dayKey(createdAt);
  if (previousCreatedAt && dayKey(previousCreatedAt) === key) {
    return null;
  }
  return {
    type: "day",
    key,
    label: formatThreadDayLabel(createdAt, locale, now, copy),
  };
}
