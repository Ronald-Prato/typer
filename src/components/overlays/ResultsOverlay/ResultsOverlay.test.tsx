import { act } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ResultsOverlay } from "./ResultsOverlay";

const roundData = [
  {
    phrase: "prueba corta",
    errors: 0,
    timeMs: 1000,
    accuracy: 100,
    wpm: 60,
  },
];

describe("ResultsOverlay", () => {
  it("restarts with the configured tab shortcut instead of space or borrar", () => {
    const handleClose = vi.fn();
    const handleRestart = vi.fn();

    render(
      <ResultsOverlay
        isVisible
        roundsData={roundData}
        onClose={handleClose}
        onRestart={handleRestart}
        restartShortcut="Tab"
      />
    );

    expect(
      screen.getByRole("button", { name: /reintentar tab/i })
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { code: "Space", key: " " });
    expect(handleRestart).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Backspace" });
    expect(handleRestart).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Tab" });
    expect(handleRestart).toHaveBeenCalledTimes(1);
  });

  it("waits for the configured timeout before enabling result shortcuts", () => {
    vi.useFakeTimers();

    try {
      const handleClose = vi.fn();
      const handleRestart = vi.fn();

      render(
        <ResultsOverlay
          isVisible
          roundsData={roundData}
          onClose={handleClose}
          onRestart={handleRestart}
          restartShortcut="Tab"
          shortcutDelayMs={500}
        />
      );

      fireEvent.keyDown(document, { key: "Tab" });
      fireEvent.keyDown(document, { key: "Enter" });
      expect(handleRestart).not.toHaveBeenCalled();
      expect(handleClose).not.toHaveBeenCalled();

      vi.advanceTimersByTime(499);
      fireEvent.keyDown(document, { key: "Tab" });
      expect(handleRestart).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      fireEvent.keyDown(document, { key: "Tab" });
      fireEvent.keyDown(document, { key: "Enter" });
      expect(handleRestart).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("can hide the tip panel", () => {
    render(
      <ResultsOverlay
        isVisible
        roundsData={roundData}
        onClose={vi.fn()}
        showTipPanel={false}
      />
    );

    expect(screen.queryByText("Tip de práctica")).not.toBeInTheDocument();
    expect(screen.queryByText("Nivel actual")).not.toBeInTheDocument();
  });

  it("can customize the primary close action label", () => {
    render(
      <ResultsOverlay
        isVisible
        roundsData={roundData}
        onClose={vi.fn()}
        closeLabel="Continuar"
      />
    );

    expect(
      screen.getByRole("button", { name: /continuar/i })
    ).toBeInTheDocument();
  });

  it("can hide loss-specific hero chrome and the tip panel", () => {
    render(
      <ResultsOverlay
        isVisible
        roundsData={roundData}
        onClose={vi.fn()}
        heroIcon={<span data-testid="hero-icon" />}
        heroLabel="Texto escrito"
        showHeroIcon={false}
        showHeroLabel={false}
        showTipPanel={false}
        title="Derrota"
      />
    );

    expect(screen.queryByTestId("hero-icon")).not.toBeInTheDocument();
    expect(screen.queryByText("Texto escrito")).not.toBeInTheDocument();
    expect(screen.queryByText("Tip de práctica")).not.toBeInTheDocument();
    expect(screen.queryByText("Nivel actual")).not.toBeInTheDocument();
  });

  it("renders an optional typocoin reward as the primary victory moment", () => {
    vi.useFakeTimers();

    try {
      render(
        <ResultsOverlay
          isVisible
          roundsData={roundData}
          onClose={vi.fn()}
          heroLabel="Texto escrito"
          typocoinRewardAmount={10}
        />
      );

      expect(screen.queryByText("typocoins")).not.toBeInTheDocument();
      expect(screen.queryByText("ganados")).not.toBeInTheDocument();
      expect(screen.queryByText("Texto escrito")).not.toBeInTheDocument();
      expect(screen.queryByText("Tip de práctica")).not.toBeInTheDocument();
      expect(screen.queryByText("Nivel actual")).not.toBeInTheDocument();
      expect(screen.getByText("+0")).toBeInTheDocument();
      const rewardStatus = screen.getByRole("status", {
        name: "+10 typocoins",
      });
      expect(rewardStatus).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(479);
      });
      expect(screen.getByText("+0")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(451);
      });
      expect(screen.getByText("+10")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
