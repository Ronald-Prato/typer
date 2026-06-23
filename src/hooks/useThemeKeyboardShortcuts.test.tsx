import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useThemeKeyboardShortcuts } from "./useThemeKeyboardShortcuts";

describe("useThemeKeyboardShortcuts", () => {
  it("switches between light and dark theme with L and D", () => {
    const handleThemeChange = vi.fn();

    renderHook(() =>
      useThemeKeyboardShortcuts({ onThemeChange: handleThemeChange })
    );

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "l" }));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "D" }));

    expect(handleThemeChange).toHaveBeenNthCalledWith(1, "light");
    expect(handleThemeChange).toHaveBeenNthCalledWith(2, "dark");
  });

  it("ignores theme keys while typing in editable fields", () => {
    const handleThemeChange = vi.fn();
    const input = document.createElement("input");
    document.body.append(input);

    renderHook(() =>
      useThemeKeyboardShortcuts({ onThemeChange: handleThemeChange })
    );

    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "d", bubbles: true })
    );

    expect(handleThemeChange).not.toHaveBeenCalled();
    input.remove();
  });

  it("ignores modified and repeated key presses", () => {
    const handleThemeChange = vi.fn();

    renderHook(() =>
      useThemeKeyboardShortcuts({ onThemeChange: handleThemeChange })
    );

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "l", ctrlKey: true })
    );
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "d", repeat: true })
    );

    expect(handleThemeChange).not.toHaveBeenCalled();
  });

  it("does not listen when disabled", () => {
    const handleThemeChange = vi.fn();

    renderHook(() =>
      useThemeKeyboardShortcuts({
        enabled: false,
        onThemeChange: handleThemeChange,
      })
    );

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "l" }));

    expect(handleThemeChange).not.toHaveBeenCalled();
  });
});
