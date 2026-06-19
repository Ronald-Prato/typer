import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("exposes loading state accessibly and blocks clicks", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button loading onClick={onClick}>
        Save changes
      </Button>
    );

    const button = screen.getByRole("button", { name: /save changes/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status", { name: /loading/i })).toBeInTheDocument();

    await user.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });
});
