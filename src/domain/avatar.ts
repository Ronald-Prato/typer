import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";

export const DICEBEAR_AVATAR_BASE =
  "https://api.dicebear.com/7.x/avataaars/svg";
export const DICEBEAR_URL_PREFIX = "https://api.dicebear.com/";
export const DEFAULT_AVATAR_SEED = "typewars-player";

export const avatarUrlFromSeed = (seed: string) =>
  `${DICEBEAR_AVATAR_BASE}?seed=${encodeURIComponent(seed)}`;

export const normalizeAvatarSeed = (seed?: string | null) => {
  const trimmed = seed?.trim();

  return trimmed || null;
};

export const dicebearAvatarDataUriFromSeed = (seed?: string | null) => {
  const normalizedSeed = normalizeAvatarSeed(seed);

  if (!normalizedSeed) return null;

  return createAvatar(avataaars, { seed: normalizedSeed }).toDataUri();
};

export const resolveAvatarUrl = ({
  avatarSeed,
  avatarUrl,
}: {
  avatarSeed?: string | null;
  avatarUrl?: string | null;
}) => {
  const normalizedSeed = normalizeAvatarSeed(avatarSeed);

  if (normalizedSeed) {
    return avatarUrlFromSeed(normalizedSeed);
  }

  return typeof avatarUrl === "string" &&
    avatarUrl.startsWith(DICEBEAR_URL_PREFIX)
    ? avatarUrl
    : null;
};
