// Calculate WPM (Words Per Minute)
export const calculateWPM = (characters: number, timeMs: number): number => {
  if (timeMs === 0) return 0;

  // Standard WPM calculation: 5 characters = 1 word
  const words = characters / 5;
  const minutes = timeMs / (1000 * 60);

  return Math.round(words / minutes);
};

// Calculate accuracy percentage
export const calculateAccuracy = (
  totalCharacters: number,
  errors: number
): number => {
  if (totalCharacters === 0) return 100;

  const accuracy = ((totalCharacters - errors) / totalCharacters) * 100;
  return Math.round(accuracy);
};

// Calculate total characters from text
export const getCharacterCount = (text: string): number => {
  return text.length;
};

// Calculate total characters from array of words
export const getCharacterCountFromWords = (words: string[]): number => {
  return words.join("").length;
};

// Calculate total characters from holds array
export const getCharacterCountFromHolds = (
  holds: { word: string; number: number }[]
): number => {
  return holds.reduce((total, hold) => total + hold.word.length, 0);
};
