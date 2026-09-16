import { describe, expect, it } from "vitest";
import {
  findMentionRanges,
  uniqueMentionedParticipants,
} from "@/lib/comment-mentions";

const anna = { id: "clannaxxxxxxxxxxxxxxxxxxxxx", displayName: "Anna" };
const annaMarie = {
  id: "clmarixxxxxxxxxxxxxxxxxxxxx",
  displayName: "Anna Marie",
};
const owner = { id: "clownerxxxxxxxxxxxxxxxxxxxx", displayName: "Owner" };

describe("comment mentions", () => {
  it("matches the longest display name first", () => {
    const matches = findMentionRanges("Ask @Anna Marie tomorrow", [
      anna,
      annaMarie,
    ]);
    expect(matches).toEqual([
      { start: 4, end: 15, participant: annaMarie },
    ]);
  });

  it("requires a start or whitespace boundary", () => {
    expect(findMentionRanges("email@Anna.com", [anna])).toEqual([]);
  });

  it("is case-insensitive and unique by participant", () => {
    const unique = uniqueMentionedParticipants("@owner and @Owner", [owner]);
    expect(unique).toEqual([owner]);
  });
});
