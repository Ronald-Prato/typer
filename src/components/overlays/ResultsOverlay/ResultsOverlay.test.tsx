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
  it("restarts with the configured borrar shortcut instead of space", () => {
    const handleClose = vi.fn();
    const handleRestart = vi.fn();

    render(
      <ResultsOverlay
        isVisible
        roundsData={roundData}
        onClose={handleClose}
        onRestart={handleRestart}
        restartShortcut="Borrar"
      />
    );

    expect(
      screen.getByRole("button", { name: /reintentar borrar/i })
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { code: "Space", key: " " });
    expect(handleRestart).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Backspace" });
    expect(handleRestart).toHaveBeenCalledTimes(1);
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
});
