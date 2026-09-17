import { describe, expect, it } from "vitest";
import {
  OWNER_PARTICIPANT_NAME,
  PARTICIPANT_LAST_SEEN_TOUCH_MS,
} from "@/lib/constants";
import {
  decideJoinParticipantSlot,
  isActiveParticipant,
  isAlwaysActiveDisplayName,
  participantActiveSince,
  pickReclaimableAvatar,
  touchParticipantLastSeen,
  visibleParticipantFilter,
} from "@/lib/participant-activity";

const now = new Date("2026-09-17T12:00:00.000Z");
const msPerDay = 24 * 60 * 60 * 1000;

function daysAgo(days: number, extraMs = 0): Date {
  return new Date(now.getTime() - days * msPerDay - extraMs);
}

describe("participant activity", () => {
  it("keeps Owner active regardless of lastSeenAt", () => {
    expect(isAlwaysActiveDisplayName(OWNER_PARTICIPANT_NAME)).toBe(true);
    expect(isAlwaysActiveDisplayName("owner")).toBe(true);
    expect(
      isActiveParticipant(
        { displayName: "owner", lastSeenAt: daysAgo(400) },
        now,
      ),
    ).toBe(true);
  });

  it("treats 90 days as the last active instant", () => {
    expect(participantActiveSince(now)).toEqual(daysAgo(90));
    expect(
      isActiveParticipant(
        { displayName: "Anna", lastSeenAt: daysAgo(90) },
        now,
      ),
    ).toBe(true);
    expect(
      isActiveParticipant(
        { displayName: "Anna", lastSeenAt: daysAgo(90, 1) },
        now,
      ),
    ).toBe(false);
  });

  it("does not count inactive people toward the 20-person cap", () => {
    expect(decideJoinParticipantSlot(false, 19)).toBe("create");
    expect(decideJoinParticipantSlot(false, 20)).toBe("full");
    expect(decideJoinParticipantSlot(true, 20)).toBe("rejoin");
  });

  it("includes Owner, recent visitors, and an explicit id in the list filter", () => {
    expect(visibleParticipantFilter("clinclude", now)).toEqual({
      OR: [
        { id: "clinclude" },
        {
          displayName: {
            equals: OWNER_PARTICIPANT_NAME,
            mode: "insensitive",
          },
        },
        { lastSeenAt: { gte: daysAgo(90) } },
      ],
    });
  });

  it("reclaims the oldest idle non-owner sticker", () => {
    const chosen = pickReclaimableAvatar(
      [
        {
          id: "owner-1",
          displayName: OWNER_PARTICIPANT_NAME,
          lastSeenAt: daysAgo(400),
          createdAt: daysAgo(400),
          avatarKey: "fox",
        },
        {
          id: "old-1",
          displayName: "Anna",
          lastSeenAt: daysAgo(200),
          createdAt: daysAgo(200),
          avatarKey: "owl",
        },
        {
          id: "old-2",
          displayName: "Lina",
          lastSeenAt: daysAgo(120),
          createdAt: daysAgo(120),
          avatarKey: "panda",
        },
        {
          id: "fresh-1",
          displayName: "Narek",
          lastSeenAt: daysAgo(2),
          createdAt: daysAgo(2),
          avatarKey: "whale",
        },
      ],
      now,
    );
    expect(chosen?.id).toBe("old-1");
    expect(chosen?.avatarKey).toBe("owl");
  });

  it("does not reclaim from Owner or currently active people", () => {
    expect(
      pickReclaimableAvatar(
        [
          {
            id: "owner-1",
            displayName: OWNER_PARTICIPANT_NAME,
            lastSeenAt: daysAgo(400),
            createdAt: daysAgo(400),
            avatarKey: "fox",
          },
          {
            id: "fresh-1",
            displayName: "Narek",
            lastSeenAt: daysAgo(2),
            createdAt: daysAgo(2),
            avatarKey: "whale",
          },
        ],
        now,
      ),
    ).toBeNull();
  });

  it("touches lastSeenAt only when the stored value is older than 12 hours", async () => {
    const calls: unknown[] = [];
    await touchParticipantLastSeen(
      {
        participant: {
          updateMany: async (args) => {
            calls.push(args);
            return { count: 1 };
          },
        },
      },
      "clidxxxxxxxxxxxxxxxxxxxxxxx",
      now,
    );
    expect(calls).toEqual([
      {
        where: {
          id: "clidxxxxxxxxxxxxxxxxxxxxxxx",
          lastSeenAt: {
            lt: new Date(now.getTime() - PARTICIPANT_LAST_SEEN_TOUCH_MS),
          },
        },
        data: { lastSeenAt: now },
      },
    ]);
  });
});
