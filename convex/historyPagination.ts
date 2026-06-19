export const DEFAULT_HISTORY_PAGE_SIZE = 6;
export const MAX_HISTORY_PAGE_SIZE = 25;

export function normalizeHistoryPageSize(limit: number | undefined) {
  if (limit === undefined) return DEFAULT_HISTORY_PAGE_SIZE;
  if (!Number.isFinite(limit)) return DEFAULT_HISTORY_PAGE_SIZE;

  return Math.min(
    MAX_HISTORY_PAGE_SIZE,
    Math.max(1, Math.floor(limit))
  );
}
