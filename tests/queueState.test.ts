import { describe, expect, it } from "vitest";
import {
  buildEnterQueuePatch,
  buildExitQueuePatch,
  buildBotProfile,
  canCreateBotMatchForUser,
  canCreateMatchForUser,
  getNearbyBotIntroWpm,
  hasQueuedHumanOpponent,
  type QueueableUser,
  MIN_BOT_MATCH_WAIT_MS,
  normalizeGameMode,
  selectQueuedUsers,
  selectQueuedUsersByMode,
} from "../convex/queueState";

describe("queueState", () => {
  it("does not accept or emit client-controlled queue ids", () => {
    expect(buildEnterQueuePatch(1234)).toEqual({
      queuedAt: 1234,
      queuedMode: "classic",
      status: "in_queue",
      activeGame: undefined,
    });
    expect(buildEnterQueuePatch(1234, "scroll")).toEqual({
      queuedAt: 1234,
      queuedMode: "scroll",
      status: "in_queue",
      activeGame: undefined,
    });
    expect(buildExitQueuePatch()).toEqual({
      queuedAt: undefined,
      queuedMode: undefined,
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

  it("selects queued users by game mode without mixing classic and scroll", () => {
    const users: QueueableUser[] = [
      { _id: "classic-legacy", status: "in_queue", queuedAt: 10 },
      { _id: "scroll", status: "in_queue", queuedAt: 20, queuedMode: "scroll" },
      { _id: "classic", status: "in_queue", queuedAt: 30, queuedMode: "classic" },
    ];

    expect(selectQueuedUsersByMode(users, "classic").map((user) => user._id))
      .toEqual(["classic-legacy", "classic"]);
    expect(selectQueuedUsersByMode(users, "scroll").map((user) => user._id))
      .toEqual(["scroll"]);
    expect(normalizeGameMode(undefined)).toBe("classic");
    expect(normalizeGameMode("scroll")).toBe("scroll");
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

  it("blocks bot fallback while another compatible human is queued", () => {
    const users: QueueableUser[] = [
      {
        _id: "candidate",
        status: "in_queue",
        queuedAt: 1,
        queuedMode: "classic",
      },
      {
        _id: "opponent",
        status: "in_queue",
        queuedAt: 2,
        queuedMode: "classic",
      },
      {
        _id: "scroll-player",
        status: "in_queue",
        queuedAt: 3,
        queuedMode: "scroll",
      },
    ];

    expect(hasQueuedHumanOpponent(users, "candidate", "classic")).toBe(true);
    expect(
      hasQueuedHumanOpponent(
        users.filter((user) => user._id !== "opponent"),
        "candidate",
        "classic"
      )
    ).toBe(false);
    expect(hasQueuedHumanOpponent(users, "scroll-player", "scroll")).toBe(false);
  });

  it("builds immutable bot profiles for game snapshots", () => {
    expect(
      buildBotProfile({
        botUserId: "bot",
        nickname: "Type Bot",
        avatarSeed: "seed",
        avatarUrl: "https://example.com/avatar.svg",
        highestPracticeWpm: 71,
      })
    ).toEqual({
      userId: "bot",
      nickname: "Type Bot",
      avatarSeed: "seed",
      avatarUrl: "https://example.com/avatar.svg",
      highestPracticeWpm: 71,
    });
  });

  it("keeps bot intro WPM close to the user's WPM without showing zero", () => {
    expect(getNearbyBotIntroWpm({ userWpm: 72, random: () => 0 })).toBe(64);
    expect(getNearbyBotIntroWpm({ userWpm: 72, random: () => 0.999 })).toBe(80);
    expect(getNearbyBotIntroWpm({ userWpm: 0, random: () => 0 })).toBe(37);
    expect(getNearbyBotIntroWpm({ userWpm: null, random: () => 0.5 })).toBe(45);
  });
});
