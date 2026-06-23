import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TypocoinBalance } from "./TypocoinBalance";

describe("TypocoinBalance", () => {
  it("renders a labelled typocoin balance", () => {
    render(<TypocoinBalance amount={12} size="drawer" />);

    expect(
      screen.getByRole("status", { name: "12 typocoins" })
    ).toBeInTheDocument();
    expect(screen.getByText("typocoins")).toBeInTheDocument();
  });

  it("keeps an accessible name when the visible label is hidden", () => {
    render(<TypocoinBalance amount={12} showLabel={false} />);

    expect(
      screen.getByRole("status", { name: "12 typocoins" })
    ).toBeInTheDocument();
    expect(screen.queryByText("typocoins")).not.toBeInTheDocument();
  });
});
