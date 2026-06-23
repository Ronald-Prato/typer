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
  it("does not show configurable performance options", () => {
    render(
      <GameDrawerSettingsContent
        dbUser={dbUser}
        areAudioNotificationsEnabled
        hudScale={1}
        onAddFriend={vi.fn()}
        onAudioNotificationsChange={vi.fn()}
        onHudScaleChange={vi.fn()}
        onProfileEdit={vi.fn()}
        onSignOut={vi.fn()}
        onThemeChange={vi.fn()}
      />
    );

    expect(
      screen.queryByRole("checkbox", { name: /modo bajo rendimiento/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/rendimiento/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: /12 typocoins/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(/typocoins/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/oro/i)).not.toBeInTheDocument();
  });

  it("notifies when the audio notifications toggle changes", () => {
    const handleAudioNotificationsChange = vi.fn();

    render(
      <GameDrawerSettingsContent
        dbUser={dbUser}
        areAudioNotificationsEnabled
        hudScale={1}
        onAddFriend={vi.fn()}
        onAudioNotificationsChange={handleAudioNotificationsChange}
        onHudScaleChange={vi.fn()}
        onProfileEdit={vi.fn()}
        onSignOut={vi.fn()}
        onThemeChange={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("checkbox", { name: /notificaciones de audio/i })
    );

    expect(handleAudioNotificationsChange).toHaveBeenCalledWith(false);
  });
});
