export type MatchProgressState = {
  phraseDone?: boolean;
  wordsDone?: boolean;
  lettersAndSymbolsDone?: boolean;
  holdsDone?: boolean;
};

export const matchProgressSteps = [
  "phraseDone",
  "wordsDone",
  "lettersAndSymbolsDone",
  "holdsDone",
] as const;

export const opponentProgressLabels = ["Caracteres", "Palabras", "Frase"] as const;

export function countCompletedMatchSteps(progress: MatchProgressState = {}) {
  return matchProgressSteps.filter((step) => progress[step]).length;
}

export function getOpponentProgressIndex(label: string) {
  if (label === "Frase") return 0;
  if (label === "Palabras") return 1;
  return 2;
}

export function didCurrentUserWin(args: {
  winner?: string | null;
  currentUserId?: string | null;
}) {
  return Boolean(args.winner && args.currentUserId === args.winner);
}
