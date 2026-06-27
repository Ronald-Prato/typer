import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RacerHold } from "./RacerHold";

describe("RacerHold", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("keeps the hold card light even when the global dark class is present", () => {
    document.documentElement.classList.add("dark");

    render(<RacerHold holds={[{ word: "alpha", number: 2 }]} />);

    const card = screen.getByTestId("racer-hold-card");
    expect(card).toHaveClass("bg-white/76");
    expect(card.className).not.toContain("dark:bg");
  });

  it("keeps in-progress input when the holds array identity changes with the same content", () => {
    let holds = [{ word: "alpha", number: 2 }];

    const { container, rerender } = render(<RacerHold holds={holds} />);
    const input = container.querySelector("input");

    expect(input).not.toBeNull();

    fireEvent.keyDown(document, { key: "2" });
    fireEvent.change(input as HTMLInputElement, {
      target: { value: "al" },
    });

    expect((input as HTMLInputElement).value).toBe("al");

    holds = [{ word: "alpha", number: 2 }];
    rerender(<RacerHold holds={holds} />);

    expect((input as HTMLInputElement).value).toBe("al");
  });

  it("uses the shared typing error underline for wrong held-word letters", () => {
    const { container } = render(
      <RacerHold holds={[{ word: "alpha", number: 2 }]} />
    );
    const input = container.querySelector("input");

    expect(input).not.toBeNull();

    fireEvent.keyDown(document, { key: "2" });
    fireEvent.change(input as HTMLInputElement, {
      target: { value: "x" },
    });

    expect(screen.getByText("x")).toHaveClass("underline");
    expect(screen.getByText("MANTÉN")).toHaveClass("text-[#575279]/58");
  });
});
