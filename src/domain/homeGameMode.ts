export const HOME_GAME_MODES = [
  { key: "1v1", label: "1V1", action: "Buscar partida" },
  { key: "practice", label: "PRÁCTICA", action: "Entrenar solo" },
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
