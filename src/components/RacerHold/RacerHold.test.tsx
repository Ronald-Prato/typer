import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RacerHold } from "./RacerHold";

describe("RacerHold", () => {
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
});
