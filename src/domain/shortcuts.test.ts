import { describe, expect, it } from "vitest";
import {
  SHORTCUT_PRIORITIES,
  matchesShortcut,
  pickGlobalShortcut,
} from "./shortcuts";

describe("shortcuts", () => {
  it("keeps the documented priority order", () => {
    expect(SHORTCUT_PRIORITIES.modal).toBeGreaterThan(
      SHORTCUT_PRIORITIES.editor
    );
    expect(SHORTCUT_PRIORITIES.editor).toBeGreaterThan(
      SHORTCUT_PRIORITIES.match
    );
    expect(SHORTCUT_PRIORITIES.match).toBeGreaterThan(SHORTCUT_PRIORITIES.home);
  });

  it("matches primary shortcuts by platform", () => {
    expect(
      matchesShortcut(
        { key: "k", modifier: "primary" },
        { key: "K", metaKey: true },
        "MacIntel"
      )
    ).toBe(true);
    expect(
      matchesShortcut(
        { key: "k", modifier: "primary" },
        { key: "k", ctrlKey: true },
        "Win32"
      )
    ).toBe(true);
  });

  it("selects the highest priority enabled registration", () => {
    const picked = pickGlobalShortcut(
      [
        { id: 1, scope: "home", key: "Enter", enabled: true },
        { id: 2, scope: "match", key: "Enter", enabled: true },
        { id: 3, scope: "modal", key: "Enter", enabled: false },
      ],
      { key: "Enter" }
    );

    expect(picked?.id).toBe(2);
  });
});
