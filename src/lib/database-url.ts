/**
 * pg currently treats sslmode=require as verify-full and warns on require.
 * Keep that verification behavior without the Next.js console overlay.
 */
const SSLMODE_ALIASES = /\bsslmode=(require|verify-ca|prefer)\b/i;

export function normalizeDatabaseUrl(connectionString: string): string {
  return connectionString.replace(SSLMODE_ALIASES, "sslmode=verify-full");
}

export function databaseUrlNeedsSsl(connectionString: string): boolean {
  return (
    connectionString.includes("sslmode=require") ||
    connectionString.includes("sslmode=verify-full") ||
    connectionString.includes("sslmode=verify-ca")
  );
}
