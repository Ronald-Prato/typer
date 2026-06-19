import { describe, expect, it } from "vitest";
import {
  isGameDrawerProfileEditShortcut,
  isGameDrawerToggleShortcut,
} from "./gameDrawer";

describe("gameDrawer", () => {
  it("uses the platform primary modifier for opening the drawer", () => {
    expect(
      isGameDrawerToggleShortcut({ key: "i", metaKey: true }, true)
    ).toBe(true);
    expect(
      isGameDrawerToggleShortcut({ key: "i", ctrlKey: true }, false)
    ).toBe(true);
    expect(
      isGameDrawerToggleShortcut({ key: "i", ctrlKey: true }, true)
    ).toBe(false);
  });

  it("only opens profile edit from the drawer when the drawer is open", () => {
    expect(isGameDrawerProfileEditShortcut({ key: "e" }, true)).toBe(true);
    expect(isGameDrawerProfileEditShortcut({ key: "e" }, false)).toBe(false);
    expect(isGameDrawerProfileEditShortcut({ key: "x" }, true)).toBe(false);
  });
});
