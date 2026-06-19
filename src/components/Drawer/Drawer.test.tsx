import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Drawer } from "./Drawer";

describe("Drawer", () => {
  it("renders as a named modal dialog and closes on Escape", () => {
    const onOpenChange = vi.fn();

    render(
      <Drawer open name="Game settings" onOpenChange={onOpenChange}>
        <button type="button">Save</button>
      </Drawer>
    );

    const dialog = screen.getByRole("dialog", { name: /game settings/i });
    expect(dialog).toHaveAttribute("aria-modal", "true");

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
