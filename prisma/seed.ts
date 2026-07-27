import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { createInviteToken } from "../src/lib/tokens";

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.board.findFirst();
    if (existing) {
      console.info("Seed skipped: board already exists", existing.id);
      return;
    }

    const tokens = Array.from({ length: 5 }, () => createInviteToken());
    const board = await prisma.board.create({
      data: {
        title: "OpenDesk — обсуждения проекта",
        invites: {
          create: tokens.map((token) => ({ token })),
        },
      },
    });

    console.info("Seeded board:", board.id);
    console.info("Invite tokens:");
    for (const token of tokens) {
      console.info(`  /invite/${token}`);
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
