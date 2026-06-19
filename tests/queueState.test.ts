import { describe, expect, it } from "vitest";
import {
  buildEnterQueuePatch,
  buildExitQueuePatch,
  buildBotProfile,
  canCreateBotMatchForUser,
  canCreateMatchForUser,
  MIN_BOT_MATCH_WAIT_MS,
  selectQueuedUsers,
} from "../convex/queueState";

describe("queueState", () => {
  it("does not accept or emit client-controlled queue ids", () => {
    expect(buildEnterQueuePatch(1234)).toEqual({
      queuedAt: 1234,
      status: "in_queue",
      activeGame: undefined,
    });
    expect(buildExitQueuePatch()).toEqual({
      queuedAt: undefined,
      status: "online",
      activeGame: undefined,
    });
  });

  it("selects queued users by status and queuedAt order with a hard limit", () => {
    const selected = selectQueuedUsers(
      [
        { _id: "late", status: "in_queue", queuedAt: 30 },
        { _id: "offline", status: "online", queuedAt: 1 },
        { _id: "early", status: "in_queue", queuedAt: 10 },
        { _id: "missing-date", status: "in_queue" },
      ],
      2
    );

    expect(selected.map((user) => user._id)).toEqual(["early", "late"]);
  });

  it("clamps queue selection limits at zero", () => {
    expect(
      selectQueuedUsers([{ _id: "queued", status: "in_queue", queuedAt: 1 }], -1)
    ).toEqual([]);
  });

  it("only creates matches for users still in queue without active games", () => {
    expect(
      canCreateMatchForUser({
        _id: "queued",
        status: "in_queue",
        queuedAt: 1,
      })
    ).toBe(true);
    expect(
      canCreateMatchForUser({
        _id: "matched",
        status: "in_queue",
        queuedAt: 1,
        activeGame: "game",
      })
    ).toBe(false);
    expect(canCreateMatchForUser({ _id: "online", status: "online" })).toBe(
      false
    );
  });

  it("only creates bot matches after the minimum queue wait", () => {
    const queuedAt = 1_000;

    expect(
      canCreateBotMatchForUser(
        { _id: "queued", status: "in_queue", queuedAt },
        queuedAt + MIN_BOT_MATCH_WAIT_MS - 1
      )
    ).toBe(false);

    expect(
      canCreateBotMatchForUser(
        { _id: "queued", status: "in_queue", queuedAt },
        queuedAt + MIN_BOT_MATCH_WAIT_MS
      )
    ).toBe(true);

    expect(
      canCreateBotMatchForUser(
        {
          _id: "matched",
          status: "in_queue",
          queuedAt,
          activeGame: "game",
        },
        queuedAt + MIN_BOT_MATCH_WAIT_MS
      )
    ).toBe(false);
  });

  it("builds immutable bot profiles for game snapshots", () => {
    expect(
      buildBotProfile({
        botUserId: "bot",
        nickname: "Type Bot",
        avatarSeed: "seed",
        avatarUrl: "https://example.com/avatar.svg",
      })
    ).toEqual({
      userId: "bot",
      nickname: "Type Bot",
      avatarSeed: "seed",
      avatarUrl: "https://example.com/avatar.svg",
    });
  });
});
