/**
 * URL slug from board title for human-readable join links:
 * `/b/{slug}/{joinToken}`
 */
export function slugifyTitle(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 48);

  return base.length > 0 ? base : "board";
}

export function withSlugSuffix(base: string, suffix: string): string {
  const trimmedBase = base.slice(0, Math.max(1, 48 - suffix.length - 1));
  return `${trimmedBase}-${suffix}`;
}
