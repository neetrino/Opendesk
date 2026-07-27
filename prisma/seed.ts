import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

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

    const board = await prisma.board.create({
      data: {
        title: "OpenDesk — обсуждения проекта",
        participants: {
          create: { displayName: "Организатор" },
        },
      },
    });

    console.info("Seeded board:", board.id);
    console.info("Open / and create invites from the board Invite button");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
