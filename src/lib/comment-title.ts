import { MAX_TITLE_LENGTH } from "@/lib/constants";

const MIN_TITLE_LENGTH = 2;

export function titleFromCommentBody(
  body: string,
  fallback: string,
): string {
  const firstLine = body.split(/\r?\n/, 1)[0] ?? "";
  const compact = firstLine.replace(/\s+/g, " ").trim();
  if (compact.length >= MIN_TITLE_LENGTH) {
    return compact.slice(0, MAX_TITLE_LENGTH);
  }
  const trimmedFallback = fallback.trim();
  if (trimmedFallback.length >= MIN_TITLE_LENGTH) {
    return trimmedFallback.slice(0, MAX_TITLE_LENGTH);
  }
  return "Task";
}
