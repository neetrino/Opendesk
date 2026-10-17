import { describe, expect, it } from "vitest";
import {
  boardExportFilename,
  formatBoardExport,
  type BoardExportSnapshot,
} from "@/lib/board-export-format";

const exportedAt = new Date("2026-10-17T09:00:00.000Z");

function snapshot(
  overrides: Partial<BoardExportSnapshot> = {},
): BoardExportSnapshot {
  return {
    boardId: "clboardxxxxxxxxxxxxxxxxxxxx",
    title: "Sprint",
    exportedAt,
    labels: [{ name: "bug" }],
    cards: [
      {
        id: "clcardxxxxxxxxxxxxxxxxxxxxx",
        title: "Fix login",
        status: "in_progress",
        urgent: true,
        position: 1,
        authorName: "Owner",
        createdAt: new Date("2026-10-16T09:00:00.000Z"),
        updatedAt: new Date("2026-10-16T10:00:00.000Z"),
        labels: ["bug"],
        commentsTruncated: false,
        comments: [
          {
            authorName: "Anna",
            body: "See ```the log```",
            createdAt: new Date("2026-10-16T11:00:00.000Z"),
            editedAt: new Date("2026-10-16T11:05:00.000Z"),
            parentAuthorName: "Owner",
            parentExcerpt: "It fails",
            attachments: [{ filename: "shot.png", kind: "image" }],
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("boardExportFilename", () => {
  it("keeps a readable markdown name for the agent", () => {
    expect(boardExportFilename("xRad / Sprint")).toBe("xRad-Sprint.md");
    expect(boardExportFilename("   ")).toBe("opendesk-board.md");
  });
});

describe("formatBoardExport", () => {
  it("writes statuses, labels, and the chat for an agent", () => {
    const markdown = formatBoardExport(snapshot());

    expect(markdown).toContain("Board: Sprint");
    expect(markdown).toContain("Board id: clboardxxxxxxxxxxxxxxxxxxxx");
    expect(markdown).toContain("- bug");
    expect(markdown).toContain("## in_progress");
    expect(markdown).toContain("id: clcardxxxxxxxxxxxxxxxxxxxxx");
    expect(markdown).toContain("urgent: yes");
    expect(markdown).toContain("labels: bug");
    expect(markdown).toContain("reply to Owner: It fails");
    expect(markdown).toContain("(edited)");
    expect(markdown).toContain("files: shot.png (image)");
    expect(markdown).toContain("## new\n\nNone.");
    expect(markdown).toContain("````");
  });

  it("keeps column order when cards arrive out of sequence", () => {
    const markdown = formatBoardExport(
      snapshot({
        cards: [
          {
            id: "cldonexxxxxxxxxxxxxxxxxxxxx",
            title: "Later",
            status: "done",
            urgent: false,
            position: 0,
            authorName: "Owner",
            createdAt: new Date("2026-10-15T09:00:00.000Z"),
            updatedAt: new Date("2026-10-15T09:00:00.000Z"),
            labels: [],
            comments: [],
            commentsTruncated: false,
          },
          {
            id: "clnewxxxxxxxxxxxxxxxxxxxxxx",
            title: "First",
            status: "new",
            urgent: false,
            position: 0,
            authorName: "Owner",
            createdAt: new Date("2026-10-17T09:00:00.000Z"),
            updatedAt: new Date("2026-10-17T09:00:00.000Z"),
            labels: [],
            comments: [],
            commentsTruncated: false,
          },
        ],
      }),
    );

    expect(markdown.indexOf("### First")).toBeLessThan(
      markdown.indexOf("### Later"),
    );
    expect(markdown).toContain("No messages.");
  });
});
