export type PracticePhraseSelection = {
  phrases: string[];
  seenPhrases: string[];
};

const DEFAULT_PRACTICE_PHRASE_COUNT = 5;

function getShuffledItems<T>(items: T[], random: () => number): T[] {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function selectPracticePhrases(
  allPhrases: string[],
  seenPhrases: string[] = [],
  count = DEFAULT_PRACTICE_PHRASE_COUNT,
  random: () => number = Math.random
): PracticePhraseSelection {
  const normalizedCount = Math.max(0, Math.floor(count));
  const uniquePhrases = Array.from(new Set(allPhrases));

  if (normalizedCount === 0 || uniquePhrases.length === 0) {
    return { phrases: [], seenPhrases };
  }

  const seenSet = new Set(seenPhrases);
  const unseenPhrases = uniquePhrases.filter((phrase) => !seenSet.has(phrase));
  const selectedUnseen = getShuffledItems(unseenPhrases, random).slice(
    0,
    normalizedCount
  );

  if (selectedUnseen.length === normalizedCount) {
    return {
      phrases: selectedUnseen,
      seenPhrases: Array.from(new Set([...seenPhrases, ...selectedUnseen])),
    };
  }

  const nextCycleNeeded = normalizedCount - selectedUnseen.length;
  const refillPhrases = getShuffledItems(
    uniquePhrases.filter((phrase) => !selectedUnseen.includes(phrase)),
    random
  ).slice(0, nextCycleNeeded);
  const phrases = [...selectedUnseen, ...refillPhrases];

  return {
    phrases,
    seenPhrases: phrases,
  };
}
