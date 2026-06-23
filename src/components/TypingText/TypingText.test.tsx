import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { TypingText } from "./TypingText";

describe("TypingText", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps pending letters static by default in low performance mode", () => {
    render(<TypingText targetText="abc" userInput="a" variant="h6" />);

    const pendingLetter = screen.getByText("c");

    expect(pendingLetter).not.toHaveClass("transition-all");
    expect(pendingLetter).not.toHaveClass("hover:scale-105");
  });

  it("keeps correctly typed letters static when stored settings try to restore visual mode", () => {
    window.localStorage.setItem("typewars.low-performance-mode", "false");

    render(<TypingText targetText="abc" userInput="a" variant="h6" />);

    const correctLetter = screen.getByText("a");
    const pendingLetter = screen.getByText("c");

    expect(correctLetter).not.toHaveClass("transition-all");
    expect(correctLetter).not.toHaveClass("duration-200");
    expect(correctLetter).not.toHaveClass("hover:scale-105");
    expect(pendingLetter).not.toHaveClass("transition-all");
  });

  it("shows a blocked wrong attempt on the active character", () => {
    window.localStorage.setItem("typewars.low-performance-mode", "false");

    render(
      <TypingText
        targetText="abc"
        userInput="a"
        mistake={{ index: 1, char: "x", attempt: 1 }}
        variant="h6"
      />
    );

    const wrongLetter = screen.getByText("x");

    expect(wrongLetter).toHaveClass("underline");
    expect(wrongLetter).not.toHaveClass("motion-safe:animate-pulse");
    expect(screen.queryByText("b")).not.toBeInTheDocument();
  });
});
