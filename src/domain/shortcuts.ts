export type ShortcutScope = "modal" | "editor" | "match" | "home";
export type ShortcutModifier = "none" | "primary";

export interface ShortcutDefinition {
  key: string;
  modifier?: ShortcutModifier;
}

export interface ShortcutRegistration extends ShortcutDefinition {
  id: number;
  scope: ShortcutScope;
  enabled?: boolean;
}

export interface ShortcutEventLike {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
}

export const SHORTCUT_PRIORITIES: Record<ShortcutScope, number> = {
  modal: 400,
  editor: 300,
  match: 200,
  home: 100,
};

export function pickGlobalShortcut<T extends ShortcutRegistration>(
  registrations: T[],
  event: ShortcutEventLike,
  platform = defaultPlatform()
): T | null {
  return (
    registrations
      .filter((registration) => registration.enabled !== false)
      .filter((registration) => matchesShortcut(registration, event, platform))
      .sort(
        (left, right) =>
          SHORTCUT_PRIORITIES[right.scope] - SHORTCUT_PRIORITIES[left.scope] ||
          right.id - left.id
      )[0] ?? null
  );
}

export function matchesShortcut(
  shortcut: ShortcutDefinition,
  event: ShortcutEventLike,
  platform = defaultPlatform()
): boolean {
  if (normalizeKey(shortcut.key) !== normalizeKey(event.key)) {
    return false;
  }

  const modifier = shortcut.modifier ?? "none";
  if (modifier === "primary") {
    return isMacPlatform(platform)
      ? Boolean(event.metaKey)
      : Boolean(event.ctrlKey);
  }

  return !event.metaKey && !event.ctrlKey;
}

export function defaultPlatform(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.platform;
}

export function isMacPlatform(platform: string): boolean {
  return platform.toUpperCase().includes("MAC");
}

function normalizeKey(key: string): string {
  return key.length === 1 ? key.toLowerCase() : key;
}
