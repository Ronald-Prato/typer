import { describe, expect, it } from "vitest";
import {
  getCanonicalFriendshipUsers,
  getFriendshipStatus,
  normalizeNicknameSearch,
  normalizeSocialPageSize,
  userPairKey,
} from "../convex/socialState";

describe("socialState", () => {
  it("builds stable pair keys regardless of user order", () => {
    expect(userPairKey("bob", "alice")).toBe("alice:bob");
    expect(userPairKey("alice", "bob")).toBe("alice:bob");
  });

  it("stores friendships in canonical user order", () => {
    expect(getCanonicalFriendshipUsers("bob", "alice")).toEqual({
      userAId: "alice",
      userBId: "bob",
    });
  });

  it("derives friendship status from friendship and pending request state", () => {
    expect(
      getFriendshipStatus({
        currentUserId: "alice",
        friendshipExists: true,
      })
    ).toBe("friends");
    expect(
      getFriendshipStatus({
        currentUserId: "alice",
        friendshipExists: false,
        pendingRequest: { requesterId: "alice", receiverId: "bob" },
      })
    ).toBe("request_sent");
    expect(
      getFriendshipStatus({
        currentUserId: "alice",
        friendshipExists: false,
        pendingRequest: { requesterId: "bob", receiverId: "alice" },
      })
    ).toBe("request_received");
    expect(
      getFriendshipStatus({
        currentUserId: "alice",
        friendshipExists: false,
      })
    ).toBe("none");
  });

  it("normalizes nickname search keys consistently", () => {
    expect(normalizeNicknameSearch("  Alice DEV  ")).toBe("alice dev");
  });

  it("normalizes social page sizes defensively", () => {
    expect(normalizeSocialPageSize(undefined)).toBe(25);
    expect(normalizeSocialPageSize(Number.NaN)).toBe(25);
    expect(normalizeSocialPageSize(0)).toBe(1);
    expect(normalizeSocialPageSize(6.7)).toBe(6);
    expect(normalizeSocialPageSize(500)).toBe(50);
  });
});
