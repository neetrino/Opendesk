import { describe, expect, it } from "vitest";
import {
  buildLocalBoardCard,
  createLocalCardId,
  isLocalCardId,
  mergeLocalCards,
  mergeVisibleCards,
  overlayHeldCards,
  pruneConfirmedHeldCards,
  pruneConfirmedLocalCards,
  toBoardCardFromCreated,
} from "@/lib/local-cards";

const author = {
  participantId: "clauthorxxxxxxxxxxxxxxxxxxx",
  displayName: "Anna",
  avatarKey: "fox",
};

describe("local cards", () => {
  it("marks generated ids as local", () => {
    const id = createLocalCardId();
    expect(isLocalCardId(id)).toBe(true);
    expect(isLocalCardId("clxxxxxxxxxxxxxxxxxxxxxxxxx")).toBe(false);
  });

  it("appends local cards that are not yet on the server", () => {
    const server = [{ id: "server-1" }];
    const local = [{ id: "local-1" }, { id: "server-1" }];

    expect(mergeLocalCards(server, local)).toEqual([
      { id: "server-1" },
      { id: "local-1" },
    ]);
  });

  it("drops local cards after the server list includes them", () => {
    const server = [{ id: "card-1" }];
    const local = [{ id: "card-1" }, { id: "local-2" }];

    expect(pruneConfirmedLocalCards(server, local)).toEqual([{ id: "local-2" }]);
  });

  it("returns the same local array when nothing was confirmed", () => {
    const server = [{ id: "card-1" }];
    const local = [{ id: "local-2" }];

    expect(pruneConfirmedLocalCards(server, local)).toBe(local);
  });

  it("builds a client card with the current author and no comments", () => {
    const card = buildLocalBoardCard({
      boardId: "clboardxxxxxxxxxxxxxxxxxxxx",
      status: "new",
      title: "Ship login",
      urgent: true,
      author,
    });

    expect(isLocalCardId(card.id)).toBe(true);
    expect(card.title).toBe("Ship login");
    expect(card.author.displayName).toBe("Anna");
    expect(card.commentCount).toBe(0);
    expect(card.attachmentCount).toBe(0);
  });

  it("maps a created server card onto the local board shape", () => {
    const createdAt = new Date("2026-08-13T12:00:00.000Z");
    const card = toBoardCardFromCreated(
      {
        id: "clcardxxxxxxxxxxxxxxxxxxxxx",
        boardId: "clboardxxxxxxxxxxxxxxxxxxxx",
        authorId: author.participantId,
        status: "new",
        title: "Need copy",
        urgent: false,
        position: 3,
        pinnedCommentId: null,
        createdAt,
        updatedAt: createdAt,
      },
      author,
    );

    expect(isLocalCardId(card.id)).toBe(false);
    expect(card.position).toBe(3);
    expect(card.author.id).toBe(author.participantId);
    expect(card.commentCount).toBe(0);
    expect(card.attachmentCount).toBe(0);
  });

  it("keeps first-page cards ahead of extras and held cards", () => {
    expect(
      mergeVisibleCards(
        [{ id: "page-1" }],
        [{ id: "extra-1" }, { id: "page-1" }],
        [{ id: "held-1" }, { id: "extra-1" }],
        [{ id: "local-1" }],
      ),
    ).toEqual([
      { id: "page-1" },
      { id: "extra-1" },
      { id: "held-1" },
      { id: "local-1" },
    ]);
  });

  it("lets a held move replace the stale server copy of the same card", () => {
    const server = [{ id: "card-1", status: "new" as const, position: 3 }];
    const held = [{ id: "card-1", status: "done" as const, position: 0 }];

    expect(overlayHeldCards(server, held)).toEqual(held);
    expect(pruneConfirmedHeldCards(server, held)).toEqual(held);
    expect(
      pruneConfirmedHeldCards(
        [{ id: "card-1", status: "done" as const, position: 0 }],
        held,
      ),
    ).toEqual([]);
  });
});
