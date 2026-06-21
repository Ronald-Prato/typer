import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserAvatarImage } from "./UserAvatarImage";

describe("UserAvatarImage", () => {
  it("renders a DiceBear generated avatar from the seed", () => {
    render(<UserAvatarImage avatarSeed="ron player" nickname="Ron Player" />);

    const avatar = screen.getByRole("img", { name: "Ron Player" });

    expect(avatar).toHaveAttribute(
      "src",
      expect.stringContaining("data:image/svg+xml;utf8,")
    );
    expect(decodeURIComponent(avatar.getAttribute("src") ?? "")).toContain(
      "<dc:title>Avataaars</dc:title>"
    );
  });

  it("falls back to initials when the avatar image fails to load", () => {
    render(<UserAvatarImage avatarSeed="broken" nickname="Ron Player" />);

    fireEvent.error(screen.getByRole("img", { name: "Ron Player" }));

    expect(screen.getByText("RP")).toBeInTheDocument();
  });
});
