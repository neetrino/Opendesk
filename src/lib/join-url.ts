/** Permanent join path: `/b/{slug}/{joinToken}` */
export function buildJoinPath(slug: string, joinToken: string): string {
  return `/b/${slug}/${joinToken}`;
}
