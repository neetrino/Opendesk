import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { OWNER_PARTICIPANT_NAME, MIN_PASSWORD_LENGTH } from "../src/lib/constants";
import { normalizeEmail } from "../src/lib/account-link";
import { hashPassword } from "../src/lib/password";
import { normalizeDatabaseUrl } from "../src/lib/database-url";

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({
    connectionString: normalizeDatabaseUrl(connectionString),
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const admin = await ensurePlatformAdmin(prisma);
    await backfillOwnedBoards(prisma, admin.id);

    const existing = await prisma.board.findFirst();
    if (existing) {
      console.info("Seed skipped new board: one already exists", existing.id);
      return;
    }

    const joinToken = randomBytes(24).toString("base64url");
    const board = await prisma.board.create({
      data: {
        title: "OpenDesk — обсуждения проекта",
        slug: "opendesk-obsuzhdeniya-proekta",
        joinToken,
        ownerId: admin.id,
        participants: {
          create: {
            displayName: OWNER_PARTICIPANT_NAME,
            userId: admin.id,
          },
        },
      },
    });

    console.info("Seeded board:", board.id);
    console.info(`Join link: /b/${board.slug}/${board.joinToken}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

async function ensurePlatformAdmin(prisma: PrismaClient) {
  const existing = await prisma.user.findFirst({
    where: { role: "platform_admin" },
    orderBy: { createdAt: "asc" },
  });
  if (existing) {
    return existing;
  }

  const emailRaw = process.env.ADMIN_EMAIL?.trim() ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!emailRaw || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD are required to create the first platform admin",
    );
  }
  if (!emailRaw.includes("@")) {
    throw new Error("ADMIN_EMAIL must be an email address");
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > 128) {
    throw new Error("ADMIN_PASSWORD must be 10 to 128 characters");
  }

  const email = normalizeEmail(emailRaw);
  const passwordHash = await hashPassword(password);
  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: OWNER_PARTICIPANT_NAME,
      role: "platform_admin",
    },
  });
  console.info("Created platform admin", created.email);
  return created;
}

async function backfillOwnedBoards(
  prisma: PrismaClient,
  adminId: string,
): Promise<void> {
  const unowned = await prisma.board.findMany({
    where: { ownerId: null },
    select: { id: true },
  });
  if (unowned.length === 0) {
    return;
  }

  await prisma.board.updateMany({
    where: { id: { in: unowned.map((board) => board.id) } },
    data: { ownerId: adminId },
  });
  console.info("Assigned unowned boards", unowned.length);

  const legacySeats = await prisma.participant.findMany({
    where: {
      boardId: { in: unowned.map((board) => board.id) },
      userId: null,
      displayName: { equals: OWNER_PARTICIPANT_NAME, mode: "insensitive" },
    },
    select: { id: true },
  });
  for (const seat of legacySeats) {
    await prisma.participant.updateMany({
      where: { id: seat.id, userId: null },
      data: { userId: adminId },
    });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
