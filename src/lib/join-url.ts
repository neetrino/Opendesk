/** Permanent join path: `/b/{slug}/{joinToken}` */
export function buildJoinPath(slug: string, joinToken: string): string {
  return `/b/${slug}/${joinToken}`;
}

export type JoinPathParts = {
  slug: string;
  joinToken: string;
};

/** Parse only a canonical board pathname; cookies and URLs are untrusted input. */
export function parseJoinPath(pathname: string): JoinPathParts | null {
  const match = /^\/b\/([^/]+)\/([^/]+)$/.exec(pathname);
  if (!match?.[1] || !match[2]) {
    return null;
  }

  try {
    return {
      slug: decodeURIComponent(match[1]),
      joinToken: decodeURIComponent(match[2]),
    };
  } catch {
    return null;
  }
}
