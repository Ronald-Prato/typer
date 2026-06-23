import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { useProductionVersionToast } from "./useProductionVersionToast";

vi.mock("sonner", () => ({
  toast: {
    custom: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe("useProductionVersionToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(toast.custom).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("captures the first version without showing a toast", async () => {
    const fetchVersion = vi.fn().mockResolvedValue("commit-a");

    renderHook(() =>
      useProductionVersionToast({
        enabled: true,
        fetchVersion,
        pollIntervalMs: 1_000,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchVersion).toHaveBeenCalledTimes(1);
    expect(toast.custom).not.toHaveBeenCalled();
  });

  it("shows one persistent toast when production changes version", async () => {
    const fetchVersion = vi
      .fn()
      .mockResolvedValueOnce("commit-a")
      .mockResolvedValue("commit-b");

    renderHook(() =>
      useProductionVersionToast({
        enabled: true,
        fetchVersion,
        pollIntervalMs: 1_000,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchVersion).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(toast.custom).toHaveBeenCalledTimes(1);
    expect(toast.custom).toHaveBeenCalledWith(expect.any(Function), {
      id: "production-version-update",
      duration: Infinity,
      dismissible: true,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(toast.custom).toHaveBeenCalledTimes(1);
  });

  it("does nothing when disabled", () => {
    const fetchVersion = vi.fn().mockResolvedValue("commit-a");

    renderHook(() =>
      useProductionVersionToast({
        enabled: false,
        fetchVersion,
      })
    );

    expect(fetchVersion).not.toHaveBeenCalled();
    expect(toast.custom).not.toHaveBeenCalled();
  });

  it("keeps polling after a failed version check", async () => {
    const fetchVersion = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue("commit-a");

    renderHook(() =>
      useProductionVersionToast({
        enabled: true,
        fetchVersion,
        pollIntervalMs: 1_000,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(fetchVersion).toHaveBeenCalledTimes(2);
    expect(toast.custom).not.toHaveBeenCalled();
  });
});
