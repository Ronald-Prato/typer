import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeModeControl } from "./ThemeModeControl";

describe("ThemeModeControl", () => {
  it("marks the current theme and notifies theme changes", () => {
    const handleThemeChange = vi.fn();

    render(
      <ThemeModeControl theme="dark" onThemeChange={handleThemeChange} />
    );

    expect(
      screen.getByRole("button", { name: /tema oscuro/i })
    ).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: /tema claro/i }));

    expect(handleThemeChange).toHaveBeenCalledWith("light");
  });
});
