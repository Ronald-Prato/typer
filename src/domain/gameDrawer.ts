export interface DrawerShortcutEvent {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
}

export function isGameDrawerToggleShortcut(
  event: DrawerShortcutEvent,
  isMacOS: boolean
) {
  const isPrimaryModifier = isMacOS ? event.metaKey : event.ctrlKey;
  return Boolean(isPrimaryModifier && event.key.toLowerCase() === "i");
}

export function isGameDrawerProfileEditShortcut(
  event: DrawerShortcutEvent,
  isDrawerOpen: boolean
) {
  return isDrawerOpen && event.key.toLowerCase() === "e";
}
