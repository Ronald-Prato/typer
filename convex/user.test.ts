import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

declare global {
  interface ImportMeta {
    glob: (pattern: string | string[]) => Record<string, () => Promise<unknown>>;
  }
}

const modules = import.meta.glob(["./**/*.{ts,js}", "!./**/*.test.ts"]);

const identity = (subject: string, email = `${subject}@example.com`) => ({
  subject,
  email,
});

function requireRequestId(result: {
  requestId?: Id<"friendRequests">;
}): Id<"friendRequests"> {
  if (!result.requestId) {
    throw new Error("Expected a friend request id");
  }

  return result.requestId;
}

async function insertUser(
  t: ReturnType<typeof convexTest>,
  authId: string,
  nickname: string
) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("user", {
      authId,
      email: `${authId}@example.com`,
      nickname,
      nicknameSearch: nickname.trim().toLocaleLowerCase(),
      status: "online",
    });
  });
}

async function socialFixture() {
  const t = convexTest(schema, modules);
  const aliceId = await insertUser(t, "alice", "Alice");
  const bobId = await insertUser(t, "bob", "Bob");
  const carolId = await insertUser(t, "carol", "Carol");

  return {
    t,
    aliceId,
    bobId,
    carolId,
    asAlice: t.withIdentity(identity("alice")),
    asBob: t.withIdentity(identity("bob")),
    asCarol: t.withIdentity(identity("carol")),
  };
}

const findByAuthId = (
  t: ReturnType<typeof convexTest>,
  authId: string
) => {
  return t.run(async (ctx) => {
    return await (ctx.db as any)
      .query("user")
      .withIndex("by_auth_id", (q: any) => q.eq("authId", authId))
      .first();
  });
};

const expectPublicUser = (user: Record<string, unknown>) => {
  expect(user).toHaveProperty("_id");
  expect(user).toHaveProperty("nickname");
  expect(user).not.toHaveProperty("email");
  expect(user).not.toHaveProperty("authId");
  expect(user).not.toHaveProperty("avatar");
  expect(user).not.toHaveProperty("games");
  expect(user).not.toHaveProperty("friends");
  expect(user).not.toHaveProperty("friendRequests");
};

describe("user security", () => {
  test("createUser derives auth identity and email from ctx.auth", async () => {
    const t = convexTest(schema, modules);

    await t.withIdentity(identity("auth_real", "real@example.com")).mutation(
      api.user.createUser,
      {
        authId: "auth_victim",
        email: "victim@example.com",
        nickname: "Mallory",
        avatarSeed: "safe-seed",
      }
    );

    const realUser = await findByAuthId(t, "auth_real");
    const victimUser = await findByAuthId(t, "auth_victim");

    expect(realUser?.authId).toBe("auth_real");
    expect(realUser?.email).toBe("real@example.com");
    expect(realUser?.nickname).toBe("Mallory");
    expect(victimUser).toBeNull();
  });

  test("createUser never persists arbitrary SVG avatar markup", async () => {
    const t = convexTest(schema, modules);
    const maliciousSvg =
      '<svg><script>globalThis.__xss = true</script><image href="javascript:alert(1)" /></svg>';

    await t.withIdentity(identity("auth_avatar")).mutation(api.user.createUser, {
      nickname: "Avatar",
      avatar: maliciousSvg,
      avatarSeed: maliciousSvg,
    });

    const user = await findByAuthId(t, "auth_avatar");

    expect(user?.avatar).toBeUndefined();
    expect(user?.avatarSeed).not.toContain("<svg");
    expect(user?.avatarSeed).not.toContain("script");
    expect(user?.avatarUrl).toMatch(/^https:\/\/api\.dicebear\.com\//);
    expect(user?.avatarUrl).not.toContain("<");
    expect(user?.avatarUrl).not.toContain("javascript:");
  });

  test("public user DTOs do not expose auth, email, avatar markup, or relationship internals", async () => {
    const { asAlice, asBob, bobId } = await socialFixture();

    await asAlice.mutation(api.user.sendFriendRequest, { userId: bobId });

    const searchResults = await asBob.query(api.user.searchUsersByNickname, {
      nickname: "Ali",
    });
    const friendRequests = await asBob.query(api.user.getFriendRequests, {});
    const byAuthId = await asBob.query(api.user.getUserByAuthId, {
      authId: "alice",
    });

    expect(searchResults).toHaveLength(1);
    expectPublicUser(searchResults[0] as unknown as Record<string, unknown>);
    expectPublicUser(
      friendRequests[0].fromUser as unknown as Record<string, unknown>
    );
    expectPublicUser(byAuthId as unknown as Record<string, unknown>);
  });
});

describe("social relationships", () => {
  test("sends a friend request and exposes a minimal pending DTO to the receiver", async () => {
    const { asAlice, asBob, bobId } = await socialFixture();

    const result = await asAlice.mutation(api.user.sendFriendRequest, {
      userId: bobId,
    });

    expect(result).toMatchObject({ status: "pending" });

    const requests = await asBob.query(api.user.getFriendRequests, {});

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      requestId: result.requestId,
      fromUser: {
        nickname: "Alice",
        gamesCount: 0,
        status: "online",
      },
    });
    expect(requests[0].fromUser).not.toHaveProperty("email");
    expect(requests[0].fromUser).not.toHaveProperty("authId");
  });

  test("accepts only an existing pending request and creates one reciprocal friendship", async () => {
    const { asAlice, asBob, bobId } = await socialFixture();
    const result = await asAlice.mutation(api.user.sendFriendRequest, {
      userId: bobId,
    });
    const requestId = requireRequestId(result);

    await asBob.mutation(api.user.acceptFriendRequest, {
      friendRequestId: requestId,
    });
    await asBob.mutation(api.user.acceptFriendRequest, {
      friendRequestId: requestId,
    });

    const aliceFriends = await asAlice.query(api.user.getFriends, {});
    const bobFriends = await asBob.query(api.user.getFriends, {});

    expect(aliceFriends.map((friend) => friend.nickname)).toEqual(["Bob"]);
    expect(bobFriends.map((friend) => friend.nickname)).toEqual(["Alice"]);

    const friendshipRows = await asAlice.run(async (ctx) => {
      return await ctx.db.query("friendships").collect();
    });

    expect(friendshipRows).toHaveLength(1);
  });

  test("rejects a pending request without creating friendship rows", async () => {
    const { asAlice, asBob, bobId } = await socialFixture();
    const result = await asAlice.mutation(api.user.sendFriendRequest, {
      userId: bobId,
    });
    const requestId = requireRequestId(result);

    await asBob.mutation(api.user.rejectFriendRequest, {
      friendRequestId: requestId,
    });

    await expect(
      asBob.mutation(api.user.acceptFriendRequest, {
        friendRequestId: requestId,
      })
    ).rejects.toThrow(/pending/i);

    expect(await asAlice.query(api.user.getFriends, {})).toEqual([]);
    expect(await asBob.query(api.user.getFriends, {})).toEqual([]);
  });

  test("lets the requester cancel a pending request idempotently", async () => {
    const { asAlice, asBob, bobId } = await socialFixture();
    const result = await asAlice.mutation(api.user.sendFriendRequest, {
      userId: bobId,
    });
    const requestId = requireRequestId(result);

    await asAlice.mutation(api.user.cancelFriendRequest, {
      friendRequestId: requestId,
    });
    await asAlice.mutation(api.user.cancelFriendRequest, {
      friendRequestId: requestId,
    });

    expect(await asBob.query(api.user.getFriendRequests, {})).toEqual([]);

    await expect(
      asBob.mutation(api.user.acceptFriendRequest, {
        friendRequestId: requestId,
      })
    ).rejects.toThrow(/pending/i);
  });

  test("blocks self friendship and duplicate pending or accepted relationships", async () => {
    const { asAlice, asBob, aliceId, bobId } = await socialFixture();

    await expect(
      asAlice.mutation(api.user.sendFriendRequest, { userId: aliceId })
    ).rejects.toThrow(/yourself/i);

    const first = await asAlice.mutation(api.user.sendFriendRequest, {
      userId: bobId,
    });
    const duplicate = await asAlice.mutation(api.user.sendFriendRequest, {
      userId: bobId,
    });

    expect(duplicate).toEqual(first);

    const requestId = requireRequestId(first);

    await asBob.mutation(api.user.acceptFriendRequest, {
      friendRequestId: requestId,
    });

    const afterAccepted = await asAlice.mutation(api.user.sendFriendRequest, {
      userId: bobId,
    });

    expect(afterAccepted).toMatchObject({ status: "friends" });

    const pendingRows = await asAlice.run(async (ctx) => {
      return await ctx.db
        .query("friendRequests")
        .withIndex("by_receiver_status", (q) =>
          q.eq("receiverId", bobId).eq("status", "pending")
        )
        .collect();
    });

    expect(pendingRows).toHaveLength(0);
  });

  test("searches nicknames by normalized prefix and caps results", async () => {
    const t = convexTest(schema, modules);
    await insertUser(t, "searcher", "Searcher");

    for (let index = 0; index < 15; index += 1) {
      await insertUser(t, `ali-${index}`, `Alice ${index}`);
    }
    await insertUser(t, "other", "Mallory");

    const results = await t
      .withIdentity(identity("searcher"))
      .query(api.user.searchUsersByNickname, {
        nickname: "  ALI",
      });

    expect(results).toHaveLength(10);
    expect(
      results.every((user) => user.nickname?.startsWith("Alice") === true)
    ).toBe(true);
  });

  test("limits social list reads defensively", async () => {
    const { t, asAlice, aliceId } = await socialFixture();

    for (let index = 0; index < 8; index += 1) {
      const friendId = await insertUser(t, `friend-${index}`, `Friend ${index}`);
      await t.run(async (ctx) => {
        await ctx.db.insert("friendships", {
          userAId: aliceId,
          userBId: friendId,
          pairKey: `${aliceId}:${friendId}`,
          createdAt: index,
        });
      });
    }

    const friends = await asAlice.query(api.user.getFriends, { limit: 3 });

    expect(friends).toHaveLength(3);
    expect(friends.map((friend) => friend.nickname)).toEqual([
      "Friend 7",
      "Friend 6",
      "Friend 5",
    ]);
  });

  test("paginates friends with a stable createdAt cursor", async () => {
    const { t, asAlice, aliceId } = await socialFixture();

    for (let index = 0; index < 6; index += 1) {
      const friendId = await insertUser(t, `paged-friend-${index}`, `Paged ${index}`);
      await t.run(async (ctx) => {
        await ctx.db.insert("friendships", {
          userAId: aliceId,
          userBId: friendId,
          pairKey: `${aliceId}:${friendId}`,
          createdAt: index,
        });
      });
    }

    const firstPage = await asAlice.query(api.user.getFriendsPage, {
      limit: 3,
    });
    const secondPage = await asAlice.query(api.user.getFriendsPage, {
      cursorCreatedAt: firstPage.nextCursorCreatedAt ?? undefined,
      limit: 3,
    });

    expect(firstPage.page.map((friend) => friend.nickname)).toEqual([
      "Paged 5",
      "Paged 4",
      "Paged 3",
    ]);
    expect(secondPage.page.map((friend) => friend.nickname)).toEqual([
      "Paged 2",
      "Paged 1",
      "Paged 0",
    ]);
  });

  test("paginates pending friend requests with a stable createdAt cursor", async () => {
    const { t, asAlice, aliceId } = await socialFixture();

    for (let index = 0; index < 6; index += 1) {
      const requesterId = await insertUser(
        t,
        `requester-${index}`,
        `Requester ${index}`
      );
      await t.run(async (ctx) => {
        await ctx.db.insert("friendRequests", {
          requesterId,
          receiverId: aliceId,
          pairKey: `${requesterId}:${aliceId}`,
          status: "pending",
          createdAt: index,
          updatedAt: index,
        });
      });
    }

    const firstPage = await asAlice.query(api.user.getFriendRequestsPage, {
      limit: 4,
    });
    const secondPage = await asAlice.query(api.user.getFriendRequestsPage, {
      cursorCreatedAt: firstPage.nextCursorCreatedAt ?? undefined,
      limit: 4,
    });

    expect(firstPage.page.map((request) => request.fromUser.nickname)).toEqual([
      "Requester 5",
      "Requester 4",
      "Requester 3",
      "Requester 2",
    ]);
    expect(secondPage.page.map((request) => request.fromUser.nickname)).toEqual([
      "Requester 1",
      "Requester 0",
    ]);
  });

  test("does not accept a fabricated user id as a request id", async () => {
    const { asBob, aliceId } = await socialFixture();

    await expect(
      asBob.mutation(api.user.acceptFriendRequest, {
        friendRequestId: aliceId as unknown as Id<"friendRequests">,
      })
    ).rejects.toThrow();
  });
});
