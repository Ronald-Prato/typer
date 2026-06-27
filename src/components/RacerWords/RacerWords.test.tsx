import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RacerWords } from "./RacerWords";

describe("RacerWords", () => {
  it("uses the shared typing error underline for wrong letters", () => {
    const { container } = render(<RacerWords words={["alpha"]} />);
    const input = container.querySelector("input");

    expect(input).not.toBeNull();

    fireEvent.change(input as HTMLInputElement, {
      target: { value: "x" },
    });

    expect(screen.getByText("x")).toHaveClass("underline");
  });
});
