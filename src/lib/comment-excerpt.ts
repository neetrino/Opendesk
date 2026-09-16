import { PARENT_EXCERPT_LENGTH } from "@/lib/constants";

export function commentExcerpt(body: string, max = PARENT_EXCERPT_LENGTH): string {
  const compact = body.replace(/\s+/g, " ").trim();
  if (compact.length <= max) {
    return compact;
  }
  return `${compact.slice(0, max - 1).trimEnd()}…`;
}
