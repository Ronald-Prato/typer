import { describe, expect, it } from "vitest";
import {
  avatarUrlFromSeed,
  dicebearAvatarDataUriFromSeed,
  resolveAvatarUrl,
} from "./avatar";

describe("avatar domain", () => {
  it("builds DiceBear avatar URLs from seeds", () => {
    expect(avatarUrlFromSeed("ron player")).toBe(
      "https://api.dicebear.com/7.x/avataaars/svg?seed=ron%20player"
    );
  });

  it("builds DiceBear avatar data URIs from seeds", () => {
    const avatar = dicebearAvatarDataUriFromSeed("ron player");

    expect(avatar).toContain("data:image/svg+xml;utf8,");
    expect(decodeURIComponent(avatar ?? "")).toContain(
      "<dc:title>Avataaars</dc:title>"
    );
  });

  it("prefers the seed over a stored URL so stale avatar URLs can recover", () => {
    expect(
      resolveAvatarUrl({
        avatarSeed: "fresh-seed",
        avatarUrl: "https://api.dicebear.com/old/broken.svg",
      })
    ).toBe("https://api.dicebear.com/7.x/avataaars/svg?seed=fresh-seed");
  });

  it("rejects non-DiceBear stored URLs when no seed exists", () => {
    expect(
      resolveAvatarUrl({
        avatarSeed: null,
        avatarUrl: "javascript:alert(1)",
      })
    ).toBeNull();
  });
});
