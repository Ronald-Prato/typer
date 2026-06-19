import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOME_GAME_MODE_INDEX,
  getHomeGameModeIndex,
  getHomeGameModeKeyAtIndex,
  isHomeGameModeKey,
} from "./homeGameMode";

describe("homeGameMode", () => {
  it("accepts only supported mode keys", () => {
    expect(isHomeGameModeKey("1v1")).toBe(true);
    expect(isHomeGameModeKey("practice")).toBe(true);
    expect(isHomeGameModeKey("ranked")).toBe(false);
    expect(isHomeGameModeKey(null)).toBe(false);
  });

  it("resolves stored keys to carousel indexes", () => {
    expect(getHomeGameModeIndex("1v1")).toBe(0);
    expect(getHomeGameModeIndex("practice")).toBe(1);
  });

  it("falls back to the default mode for missing or stale stored values", () => {
    expect(getHomeGameModeIndex(null)).toBe(DEFAULT_HOME_GAME_MODE_INDEX);
    expect(getHomeGameModeIndex("stale-mode")).toBe(
      DEFAULT_HOME_GAME_MODE_INDEX
    );
  });

  it("returns a valid key for any requested carousel index", () => {
    expect(getHomeGameModeKeyAtIndex(1)).toBe("practice");
    expect(getHomeGameModeKeyAtIndex(999)).toBe("1v1");
  });
});
