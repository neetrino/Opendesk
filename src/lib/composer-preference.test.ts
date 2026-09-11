import { describe, expect, it } from "vitest";
import {
  DEFAULT_COMPOSER_PRIMARY_ACTION,
  parseComposerPrimaryAction,
} from "@/lib/composer-preference";

describe("parseComposerPrimaryAction", () => {
  it("accepts camera and voice", () => {
    expect(parseComposerPrimaryAction("camera")).toBe("camera");
    expect(parseComposerPrimaryAction("voice")).toBe("voice");
  });

  it("falls back to camera for empty or unknown values", () => {
    expect(parseComposerPrimaryAction(null)).toBe(
      DEFAULT_COMPOSER_PRIMARY_ACTION,
    );
    expect(parseComposerPrimaryAction("")).toBe("camera");
    expect(parseComposerPrimaryAction("mic")).toBe("camera");
  });
});
