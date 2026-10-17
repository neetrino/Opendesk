"use client";

import { ExportBoardButton } from "@/components/export-board-button";

type BoardSettingsSectionsProps = {
  boardId: string;
  isOwner: boolean;
};

/** Owner settings blocks. Add the next setting here so every settings sheet gets it. */
export function BoardSettingsSections({
  boardId,
  isOwner,
}: BoardSettingsSectionsProps) {
  if (!isOwner) {
    return null;
  }

  return (
    <div className="sheet-block">
      <ExportBoardButton boardId={boardId} />
    </div>
  );
}
