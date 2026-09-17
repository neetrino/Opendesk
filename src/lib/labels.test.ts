import { describe, expect, it } from "vitest";
import {
  cycleLabelColor,
  isLabelColorKey,
  nextLabelColor,
  normalizeLabelName,
  parseLabelColor,
  replaceBoardLabel,
  resolveCardLabels,
  sameLabelIds,
  sortBoardLabels,
  toggleCardLabels,
} from "@/lib/labels";

describe("labels", () => {
  it("accepts palette keys only", () => {
    expect(isLabelColorKey("teal")).toBe(true);
    expect(parseLabelColor("coral")).toBe("coral");
    expect(parseLabelColor("magenta")).toBeNull();
  });

  it("picks the first unused color then wraps", () => {
    expect(nextLabelColor([])).toBe("teal");
    expect(nextLabelColor(["teal", "amber"])).toBe("blue");
    expect(
      nextLabelColor([
        "teal",
        "amber",
        "blue",
        "rose",
        "violet",
        "moss",
        "rust",
        "slate",
        "gold",
        "coral",
      ]),
    ).toBe("teal");
  });

  it("cycles colors in palette order", () => {
    expect(cycleLabelColor("teal")).toBe("amber");
    expect(cycleLabelColor("coral")).toBe("teal");
  });

  it("trims and caps a label name", () => {
    expect(normalizeLabelName("  Design  ")).toBe("Design");
    expect(normalizeLabelName("a".repeat(30))).toHaveLength(10);
    expect(normalizeLabelName("   ")).toBe("");
  });

  it("compares assigned label ids without order", () => {
    expect(
      sameLabelIds([{ id: "a" }, { id: "b" }], [{ id: "b" }, { id: "a" }]),
    ).toBe(true);
    expect(sameLabelIds([{ id: "a" }], [{ id: "a" }, { id: "b" }])).toBe(false);
  });

  it("sorts labels by position then name", () => {
    expect(
      sortBoardLabels([
        { id: "2", name: "B", color: "amber", position: 1 },
        { id: "1", name: "A", color: "teal", position: 0 },
      ]).map((label) => label.id),
    ).toEqual(["1", "2"]);
  });

  it("toggles a label on a card and replaces a board label in place", () => {
    const design = {
      id: "1",
      name: "Design",
      color: "teal" as const,
      position: 0,
    };
    const bug = {
      id: "2",
      name: "Bug",
      color: "amber" as const,
      position: 1,
    };

    expect(toggleCardLabels([], design)).toEqual([design]);
    expect(toggleCardLabels([design], design)).toEqual([]);
    expect(
      replaceBoardLabel([design, bug], { ...design, color: "rose" }),
    ).toEqual([{ ...design, color: "rose" }, bug]);
    expect(
      resolveCardLabels(
        [{ ...design, name: "Old" }, bug],
        [{ ...design, name: "New", color: "rose" }],
      ),
    ).toEqual([{ ...design, name: "New", color: "rose" }]);
  });
});
