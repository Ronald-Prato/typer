import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useRacerWords } from "./useRacerWords";

describe("useRacerWords", () => {
  it("keeps in-progress input when the words array identity changes with the same content", () => {
    let words = ["alpha", "beta"];

    const { result, rerender } = renderHook(() => useRacerWords({ words }));

    act(() => {
      result.current.handleInputChange({
        preventDefault: () => {},
        target: { value: "al" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    words = ["alpha", "beta"];
    rerender();

    expect(result.current.userInput).toBe("al");
    expect(result.current.currentWord).toBe("alpha");
  });
});
