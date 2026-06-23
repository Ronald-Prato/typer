import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MatchProgressView } from "./MatchProgressView";

vi.mock("react-confetti", () => ({
  default: () => <div data-testid="confetti" />,
}));

const currentUser = {
  _id: "user-1",
  nickname: "Tú",
};

const opponent = {
  _id: "user-2",
  nickname: "Rival",
};

describe("MatchProgressView", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("does not render confetti in default low performance mode", () => {
    render(
      <MatchProgressView
        currentUser={currentUser}
        currentUserSteps={4}
        isGameFinished
        isWinner
        opponent={opponent}
        opponentSteps={2}
        viewport={{ width: 1200, height: 800 }}
      />
    );

    expect(screen.queryByTestId("confetti")).not.toBeInTheDocument();
    expect(screen.getByText("VICTORIA")).toBeInTheDocument();
  });

  it("keeps confetti disabled when stored settings try to restore visual mode", () => {
    window.localStorage.setItem("typewars.low-performance-mode", "false");

    render(
      <MatchProgressView
        currentUser={currentUser}
        currentUserSteps={4}
        isGameFinished
        isWinner
        opponent={opponent}
        opponentSteps={2}
        viewport={{ width: 1200, height: 800 }}
      />
    );

    expect(screen.queryByTestId("confetti")).not.toBeInTheDocument();
  });
});
