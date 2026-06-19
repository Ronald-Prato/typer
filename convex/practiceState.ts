export function getNextHighestPracticeWpm({
  currentHighestWpm,
  practiceWpm,
}: {
  currentHighestWpm?: number;
  practiceWpm: number;
}) {
  const roundedPracticeWpm = Math.round(practiceWpm);
  const safePracticeWpm =
    Number.isFinite(roundedPracticeWpm) && roundedPracticeWpm > 0
      ? roundedPracticeWpm
      : 0;
  const safeCurrentHighestWpm =
    currentHighestWpm !== undefined &&
    Number.isFinite(currentHighestWpm) &&
    currentHighestWpm > 0
      ? Math.round(currentHighestWpm)
      : 0;

  return Math.max(safeCurrentHighestWpm, safePracticeWpm);
}
