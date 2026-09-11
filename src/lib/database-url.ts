/**
 * pg currently treats sslmode=require as verify-full and warns on require.
 * Keep that verification behavior without the Next.js console overlay.
 */
const SSLMODE_ALIASES = /\bsslmode=(require|verify-ca|prefer)\b/i;

export function normalizeDatabaseUrl(connectionString: string): string {
  return connectionString.replace(SSLMODE_ALIASES, "sslmode=verify-full");
}

/**
 * Prisma migrate uses session-level advisory locks. Neon’s PgBouncer
 * pooler (`-pooler` hostname) cannot hold those locks, which yields P1002.
 * Prefer an explicit DIRECT_URL; otherwise strip the Neon pooler suffix.
 */
export function toUnpooledDatabaseUrl(connectionString: string): string {
  const authorityStart = connectionString.lastIndexOf("@");
  if (authorityStart === -1) {
    return connectionString;
  }

  const afterAt = connectionString.slice(authorityStart + 1);
  const hostEnd = afterAt.search(/[/?#]/);
  const hostPort = hostEnd === -1 ? afterAt : afterAt.slice(0, hostEnd);
  const remainder = hostEnd === -1 ? "" : afterAt.slice(hostEnd);
  const unpooledHostPort = hostPort.replace(/-pooler(?=\.|:|$)/, "");

  return `${connectionString.slice(0, authorityStart + 1)}${unpooledHostPort}${remainder}`;
}

/** Prisma CLI / migrate URL: DIRECT_URL, else DATABASE_URL with Neon pooler removed. */
export function resolveMigrationDatabaseUrl(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const directUrl = env.DIRECT_URL?.trim();
  if (directUrl) {
    return directUrl;
  }

  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  return toUnpooledDatabaseUrl(databaseUrl);
}

export function databaseUrlNeedsSsl(connectionString: string): boolean {
  return (
    connectionString.includes("sslmode=require") ||
    connectionString.includes("sslmode=verify-full") ||
    connectionString.includes("sslmode=verify-ca")
  );
}
