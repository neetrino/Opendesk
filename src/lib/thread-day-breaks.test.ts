import { describe, expect, it } from "vitest";
import {
  dayBreakForComment,
  formatThreadDayLabel,
} from "@/lib/thread-day-breaks";

const copy = { today: "Today", yesterday: "Yesterday" };

describe("thread day breaks", () => {
  it("labels today and yesterday", () => {
    const now = new Date("2026-09-16T15:00:00");
    expect(
      formatThreadDayLabel(new Date("2026-09-16T08:00:00"), "en", now, copy),
    ).toBe("Today");
    expect(
      formatThreadDayLabel(new Date("2026-09-15T08:00:00"), "en", now, copy),
    ).toBe("Yesterday");
  });

  it("inserts a break only when the day changes", () => {
    const now = new Date("2026-09-16T15:00:00");
    const first = dayBreakForComment(
      new Date("2026-09-16T08:00:00"),
      null,
      "en",
      now,
      copy,
    );
    const sameDay = dayBreakForComment(
      new Date("2026-09-16T09:00:00"),
      new Date("2026-09-16T08:00:00"),
      "en",
      now,
      copy,
    );
    expect(first?.label).toBe("Today");
    expect(sameDay).toBeNull();
  });
});
