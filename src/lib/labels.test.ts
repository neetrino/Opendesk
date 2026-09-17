import { describe, expect, it } from "vitest";
import {
  addOptimisticBoardLabel,
  confirmOptimisticLabel,
  cycleLabelColor,
  isLabelColorKey,
  isOptimisticLabelId,
  namesMatch,
  nextLabelColor,
  normalizeLabelName,
  optimisticLabelIdRemap,
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
    expect(parseLabelColor("fog")).toBe("fog");
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
    ).toBe("sky");
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
        "sky",
        "indigo",
        "plum",
        "wine",
        "peach",
        "olive",
        "navy",
        "mustard",
        "cocoa",
        "fog",
      ]),
    ).toBe("teal");
  });

  it("cycles colors in palette order", () => {
    expect(cycleLabelColor("teal")).toBe("amber");
    expect(cycleLabelColor("coral")).toBe("sky");
    expect(cycleLabelColor("fog")).toBe("teal");
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

  it("matches label names without case differences", () => {
    expect(namesMatch("Finance", "finance")).toBe(true);
    expect(namesMatch("Export", "Import")).toBe(false);
  });

  it("adds an optimistic label and keeps local edits on confirm", () => {
    const design = {
      id: "1",
      name: "Design",
      color: "teal" as const,
      position: 0,
    };
    const optimistic = {
      id: "optimistic-label-temp",
      name: "Export",
      color: "amber" as const,
      position: 1,
    };
    const added = addOptimisticBoardLabel([design], optimistic);
    expect(added?.map((label) => label.id)).toEqual(["1", optimistic.id]);
    expect(addOptimisticBoardLabel([design, optimistic], optimistic)).toBeNull();
    expect(isOptimisticLabelId(optimistic.id)).toBe(true);

    const saved = {
      id: "real",
      name: "Export",
      color: "amber" as const,
      position: 1,
    };
    const edited = { ...optimistic, name: "Exports", color: "rose" as const };
    expect(confirmOptimisticLabel([design, edited], optimistic.id, saved)).toEqual(
      [
        design,
        { ...saved, name: "Exports", color: "rose" },
      ],
    );
    expect(
      optimisticLabelIdRemap([design, optimistic], [design, saved]).get(
        optimistic.id,
      ),
    ).toBe("real");
  });
});
