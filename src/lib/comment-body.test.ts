import { describe, expect, it } from "vitest";
import { parseCommentBody } from "@/lib/comment-body";

const figmaUrl =
  "https://www.figma.com/design/fOvVCdmlGdVGGw0ydK2DBB/Conceptots-Dev?node-id=5023-2&t=fC4UutetWXe7xbJlt-0";

describe("parseCommentBody", () => {
  it("keeps plain text as a single block", () => {
    expect(parseCommentBody("just a note")).toEqual([
      { type: "text", spans: [{ type: "text", value: "just a note" }] },
    ]);
  });

  it("turns a Figma design URL into a preview card and keeps nearby text", () => {
    expect(parseCommentBody(`motovizor dessign -\n${figmaUrl}`)).toEqual([
      {
        type: "text",
        spans: [{ type: "text", value: "motovizor dessign -" }],
      },
      {
        type: "figma",
        href: figmaUrl,
        title: "Conceptots-Dev",
        kind: "design",
      },
    ]);
  });

  it("linkifies a regular URL with a compact label", () => {
    expect(parseCommentBody("see https://example.com/docs/start")).toEqual([
      {
        type: "text",
        spans: [
          { type: "text", value: "see " },
          {
            type: "link",
            href: "https://example.com/docs/start",
            label: "example.com/docs/start",
          },
        ],
      },
    ]);
  });

  it("strips trailing punctuation from a URL and keeps it in the text", () => {
    const parsed = parseCommentBody("open https://example.com/file.");
    expect(parsed[0]).toEqual({
      type: "text",
      spans: [
        { type: "text", value: "open " },
        {
          type: "link",
          href: "https://example.com/file",
          label: "example.com/file",
        },
        { type: "text", value: "." },
      ],
    });
  });

  it("reads prototype and FigJam paths", () => {
    expect(
      parseCommentBody("https://figma.com/proto/abc123/Checkout-flow"),
    ).toEqual([
      {
        type: "figma",
        href: "https://figma.com/proto/abc123/Checkout-flow",
        title: "Checkout-flow",
        kind: "prototype",
      },
    ]);
    expect(
      parseCommentBody("https://www.figma.com/board/xyz/Daily-stand-up"),
    ).toEqual([
      {
        type: "figma",
        href: "https://www.figma.com/board/xyz/Daily-stand-up",
        title: "Daily-stand-up",
        kind: "board",
      },
    ]);
  });
});
