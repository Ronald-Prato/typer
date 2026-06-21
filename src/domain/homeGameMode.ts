export const HOME_GAME_MODES = [
  {
    key: "1v1",
    label: "Clásico",
    badgeLabel: "1V1",
    title: "Clásico",
    action: "Buscar partida",
    theme: "orangeYellow",
  },
  {
    key: "scroll",
    label: "Scroll",
    badgeLabel: "1V1",
    title: "Scroll",
    action: "Buscar partida",
    theme: "orangeGreen",
  },
] as const;

export type HomeGameMode = (typeof HOME_GAME_MODES)[number];
export type HomeGameModeKey = HomeGameMode["key"];

export const DEFAULT_HOME_GAME_MODE_INDEX = 0;

export const isHomeGameModeKey = (
  value: string | null
): value is HomeGameModeKey =>
  HOME_GAME_MODES.some((mode) => mode.key === value);

export const getHomeGameModeIndex = (key: string | null) => {
  if (!isHomeGameModeKey(key)) return DEFAULT_HOME_GAME_MODE_INDEX;

  const index = HOME_GAME_MODES.findIndex((mode) => mode.key === key);
  return index >= 0 ? index : DEFAULT_HOME_GAME_MODE_INDEX;
};

export const getHomeGameModeKeyAtIndex = (index: number) =>
  HOME_GAME_MODES[index]?.key ?? HOME_GAME_MODES[DEFAULT_HOME_GAME_MODE_INDEX].key;

export const getQueuedHomeGameModeTitle = (
  queuedMode: string | null | undefined
) => getQueuedHomeGameMode(queuedMode).title;

export const getQueuedHomeGameMode = (
  queuedMode: string | null | undefined
) => (queuedMode === "scroll" ? HOME_GAME_MODES[1] : HOME_GAME_MODES[0]);

export const getActiveGameRoute = (mode: string | null | undefined) =>
  mode === "scroll" ? "/scroll" : "/1v1";
