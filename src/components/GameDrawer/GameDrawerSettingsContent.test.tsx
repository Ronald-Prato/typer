import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GameDrawerSettingsContent } from "./GameDrawerSettingsContent";

vi.mock("@/components/FriendList/FriendList", () => ({
  FriendList: () => <div data-testid="friend-list" />,
}));

const dbUser = {
  email: "player@example.com",
  gold: 12,
  nickname: "Player",
};

describe("GameDrawerSettingsContent", () => {
  it("shows the low performance toggle enabled by default state", () => {
    render(
      <GameDrawerSettingsContent
        dbUser={dbUser}
        hudScale={1}
        isLowPerformanceMode
        onAddFriend={vi.fn()}
        onHudScaleChange={vi.fn()}
        onLowPerformanceModeChange={vi.fn()}
        onProfileEdit={vi.fn()}
        onSignOut={vi.fn()}
        onThemeChange={vi.fn()}
      />
    );

    expect(
      screen.getByRole("checkbox", { name: /modo bajo rendimiento/i })
    ).toBeChecked();
  });

  it("notifies when the low performance toggle changes", () => {
    const handleLowPerformanceModeChange = vi.fn();

    render(
      <GameDrawerSettingsContent
        dbUser={dbUser}
        hudScale={1}
        isLowPerformanceMode
        onAddFriend={vi.fn()}
        onHudScaleChange={vi.fn()}
        onLowPerformanceModeChange={handleLowPerformanceModeChange}
        onProfileEdit={vi.fn()}
        onSignOut={vi.fn()}
        onThemeChange={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("checkbox", { name: /modo bajo rendimiento/i })
    );

    expect(handleLowPerformanceModeChange).toHaveBeenCalledWith(false);
  });
});
