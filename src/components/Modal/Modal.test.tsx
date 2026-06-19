import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { Modal, type ModalRefProps } from "./Modal";

describe("Modal", () => {
  it("renders as a modal dialog and restores focus after close", () => {
    vi.useFakeTimers();
    const ref = createRef<ModalRefProps>();

    render(
      <>
        <button type="button" onClick={() => ref.current?.openModal()}>
          Open modal
        </button>
        <Modal ref={ref} title="Profile settings">
          <Modal.Content>
            <button type="button">Focusable action</button>
          </Modal.Content>
        </Modal>
      </>
    );

    const opener = screen.getByRole("button", { name: /open modal/i });
    opener.focus();
    fireEvent.click(opener);

    const dialog = screen.getByRole("dialog", { name: /profile settings/i });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: /cerrar modal/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /cerrar modal/i }));
    act(() => vi.advanceTimersByTime(250));

    expect(screen.queryByRole("dialog", { name: /profile settings/i })).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    vi.useRealTimers();
  });
});
