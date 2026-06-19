import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import FindTheBug from "./FindTheBug";

vi.mock("@uiw/react-codemirror", () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange?: (value: string) => void;
  }) => (
    <textarea
      aria-label="Code editor"
      value={value}
      onChange={(event) => onChange?.(event.currentTarget.value)}
    />
  ),
}));

vi.mock("@codemirror/lang-javascript", () => ({
  javascript: () => ({}),
}));

vi.mock("@codemirror/theme-one-dark", () => ({
  oneDark: {},
}));

vi.mock("@codemirror/view", () => ({
  keymap: { of: () => ({}) },
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
          <div {...props}>{children}</div>
        ),
    }
  ),
}));

describe("FindTheBug", () => {
  it("does not execute snippets in the main app thread", async () => {
    const user = userEvent.setup();
    const evalSpy = vi.spyOn(globalThis, "eval");

    render(<FindTheBug />);

    await user.click(screen.getByRole("button", { name: /compilar/i }));

    expect(evalSpy).not.toHaveBeenCalled();
  });
});
