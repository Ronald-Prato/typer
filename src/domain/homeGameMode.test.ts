import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOME_GAME_MODE_INDEX,
  getActiveGameRoute,
  getHomeGameModeIndex,
  getHomeGameModeKeyAtIndex,
  getQueuedHomeGameMode,
  getQueuedHomeGameModeTitle,
  HOME_GAME_MODES,
  isHomeGameModeKey,
} from "./homeGameMode";

describe("homeGameMode", () => {
  it("accepts only supported mode keys", () => {
    expect(isHomeGameModeKey("1v1")).toBe(true);
    expect(isHomeGameModeKey("scroll")).toBe(true);
    expect(isHomeGameModeKey("practice")).toBe(false);
    expect(isHomeGameModeKey("ranked")).toBe(false);
    expect(isHomeGameModeKey(null)).toBe(false);
  });

  it("resolves stored keys to carousel indexes", () => {
    expect(getHomeGameModeIndex("1v1")).toBe(0);
    expect(getHomeGameModeIndex("scroll")).toBe(1);
  });

  it("falls back to the default mode for missing or stale stored values", () => {
    expect(getHomeGameModeIndex(null)).toBe(DEFAULT_HOME_GAME_MODE_INDEX);
    expect(getHomeGameModeIndex("stale-mode")).toBe(
      DEFAULT_HOME_GAME_MODE_INDEX
    );
  });

  it("returns a valid key for any requested carousel index", () => {
    expect(getHomeGameModeKeyAtIndex(0)).toBe("1v1");
    expect(getHomeGameModeKeyAtIndex(1)).toBe("scroll");
    expect(getHomeGameModeKeyAtIndex(999)).toBe("1v1");
  });

  it("resolves queued backend modes to visible game type titles", () => {
    expect(getQueuedHomeGameModeTitle("classic")).toBe("Clásico");
    expect(getQueuedHomeGameModeTitle("scroll")).toBe("Scroll");
    expect(getQueuedHomeGameModeTitle(undefined)).toBe("Clásico");
  });

  it("resolves queued backend modes to their home mode presentation", () => {
    expect(getQueuedHomeGameMode("classic")).toMatchObject({
      key: "1v1",
      title: "Clásico",
      theme: "orangeYellow",
    });
    expect(getQueuedHomeGameMode("scroll")).toMatchObject({
      key: "scroll",
      title: "Scroll",
      theme: "orangeGreen",
    });
    expect(getQueuedHomeGameMode("stale-mode")).toMatchObject({
      key: "1v1",
      title: "Clásico",
    });
  });

  it("routes active matches by backend game mode", () => {
    expect(getActiveGameRoute("classic")).toBe("/1v1");
    expect(getActiveGameRoute("scroll")).toBe("/scroll");
    expect(getActiveGameRoute(undefined)).toBe("/1v1");
  });

  it("keeps the selector label separate from the main display title", () => {
    expect(HOME_GAME_MODES[0]).toMatchObject({
      key: "1v1",
      label: "Clásico",
      title: "Clásico",
      theme: "orangeYellow",
    });
    expect(HOME_GAME_MODES[1]).toMatchObject({
      key: "scroll",
      label: "Scroll",
      title: "Scroll",
      action: "Buscar partida",
      theme: "orangeGreen",
    });
  });

  it("keeps the visible selector order requested by the home carousel", () => {
    expect(HOME_GAME_MODES.map((mode) => mode.label)).toEqual([
      "Clásico",
      "Scroll",
    ]);
  });
});
