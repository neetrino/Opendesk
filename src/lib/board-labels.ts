import "server-only";

import { parseLabelColor, type BoardLabelView } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export function mapBoardLabelRow(row: {
  id: string;
  name: string;
  color: string;
  position: number;
}): BoardLabelView | null {
  const color = parseLabelColor(row.color);
  if (!color) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    color,
    position: row.position,
  };
}

export async function loadBoardLabels(
  boardId: string,
): Promise<BoardLabelView[]> {
  const rows = await prisma.boardLabel.findMany({
    where: { boardId },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      color: true,
      position: true,
    },
  });

  return rows.flatMap((row) => {
    const label = mapBoardLabelRow(row);
    return label ? [label] : [];
  });
}
