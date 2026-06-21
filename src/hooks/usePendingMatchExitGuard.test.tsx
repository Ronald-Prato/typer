import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PENDING_MATCH_EXIT_STORAGE_KEY } from "@/domain/matchExit";
import { usePendingMatchExitGuard } from "./usePendingMatchExitGuard";

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

describe("usePendingMatchExitGuard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    push.mockClear();
    replace.mockClear();
    window.localStorage.clear();
  });

  it("keeps the player in the match when they cancel the home exit", () => {
    const onConfirmExit = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);

    renderHook(() =>
      usePendingMatchExitGuard({
        activeGame: "game-1",
        isFinished: false,
        onConfirmExit,
      })
    );

    const link = document.createElement("a");
    link.href = "/home";
    document.body.appendChild(link);

    act(() => {
      link.dispatchEvent(
        new MouseEvent("click", { bubbles: true, button: 0, cancelable: true })
      );
    });

    expect(onConfirmExit).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    link.remove();
  });

  it("abandons and routes home after confirming the home exit", async () => {
    const onConfirmExit = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderHook(() =>
      usePendingMatchExitGuard({
        activeGame: "game-1",
        isFinished: false,
        onConfirmExit,
      })
    );

    const link = document.createElement("a");
    link.href = "/home";
    document.body.appendChild(link);

    act(() => {
      link.dispatchEvent(
        new MouseEvent("click", { bubbles: true, button: 0, cancelable: true })
      );
    });

    await waitFor(() => {
      expect(onConfirmExit).toHaveBeenCalledTimes(1);
      expect(push).toHaveBeenCalledWith("/home");
    });
    link.remove();
  });

  it("cleans a pending page-close exit when the match page mounts again", async () => {
    const onConfirmExit = vi.fn().mockResolvedValue(undefined);
    window.localStorage.setItem(PENDING_MATCH_EXIT_STORAGE_KEY, "pending");

    renderHook(() =>
      usePendingMatchExitGuard({
        activeGame: "game-1",
        isFinished: false,
        onConfirmExit,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(onConfirmExit).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/home");
    expect(window.localStorage.getItem(PENDING_MATCH_EXIT_STORAGE_KEY)).toBe(
      null
    );
  });
});
