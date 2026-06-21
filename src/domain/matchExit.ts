export const PENDING_MATCH_EXIT_STORAGE_KEY = "typer.pendingMatchExit";

export type MatchExitSnapshot = {
  activeGame?: string | null;
  isFinished: boolean;
};

export function shouldGuardMatchExit(snapshot: MatchExitSnapshot) {
  return Boolean(snapshot.activeGame && !snapshot.isFinished);
}

export function createPendingMatchExitValue(activeGame: string) {
  return JSON.stringify({ activeGame, createdAt: Date.now() });
}
