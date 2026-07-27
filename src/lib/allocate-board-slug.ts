import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { slugifyTitle, withSlugSuffix } from "@/lib/slug";

/** Pick a unique Board.slug from the title (append hex suffix on collision). */
export async function allocateBoardSlug(title: string): Promise<string> {
  const base = slugifyTitle(title);
  const taken = await prisma.board.findUnique({
    where: { slug: base },
    select: { id: true },
  });
  if (!taken) {
    return base;
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = withSlugSuffix(base, randomBytes(3).toString("hex"));
    const clash = await prisma.board.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash) {
      return candidate;
    }
  }

  throw new Error("SLUG_ALLOCATION_FAILED");
}
