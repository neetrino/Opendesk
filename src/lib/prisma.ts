import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function shouldApplySessionOptions(connectionString: string): boolean {
  if (process.env.DATABASE_SESSION_OPTIONS === "false") {
    return false;
  }
  if (process.env.DATABASE_SESSION_OPTIONS === "true") {
    return true;
  }

  // Neon/PgBouncer pooler often rejects startup options.
  return !(
    connectionString.includes("-pooler") ||
    connectionString.includes("pgbouncer=true")
  );
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const isProduction = process.env.NODE_ENV === "production";
  const connectionLimit = Number(
    process.env.DATABASE_CONNECTION_LIMIT ?? (isProduction ? "1" : "5"),
  );
  const poolTimeout = Number(process.env.DATABASE_POOL_TIMEOUT ?? "20");
  const statementTimeoutMs = Number(
    process.env.DATABASE_STATEMENT_TIMEOUT_MS ?? "15000",
  );
  const idleTxTimeoutMs = Number(
    process.env.DATABASE_IDLE_TX_TIMEOUT_MS ?? "10000",
  );
  const lockTimeoutMs = Number(process.env.DATABASE_LOCK_TIMEOUT_MS ?? "5000");

  const needsSsl =
    connectionString.includes("sslmode=require") ||
    connectionString.includes("sslmode=verify-full") ||
    isProduction;
  // Neon works with public CAs. Set DATABASE_SSL_REJECT_UNAUTHORIZED=false only
  // as a temporary escape hatch (e.g. corporate MITM proxies in local dev).
  const rejectUnauthorized =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false";

  const poolConfig: ConstructorParameters<typeof Pool>[0] = {
    connectionString,
    max: connectionLimit,
    connectionTimeoutMillis: poolTimeout * 1000,
    ssl: needsSsl ? { rejectUnauthorized } : undefined,
  };

  if (shouldApplySessionOptions(connectionString)) {
    poolConfig.options = `-c statement_timeout=${statementTimeoutMs} -c idle_in_transaction_session_timeout=${idleTxTimeoutMs} -c lock_timeout=${lockTimeoutMs}`;
  }

  const pool = globalForPrisma.pgPool ?? new Pool(poolConfig);

  if (!isProduction) {
    globalForPrisma.pgPool = pool;
  }

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
