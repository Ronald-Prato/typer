import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { selectPracticePhrases } from "@/domain/practicePhraseSelection";

const practicePhraseSeenStorageKey = "typer.practice.phrases.seen";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateEmail(email: string) {
  const atIndex = email.indexOf("@");
  if (atIndex === -1) return email;

  const localPart = email.slice(0, atIndex);
  const domainPart = email.slice(atIndex);

  if (localPart.length <= 4) return email;

  const firstTwo = localPart.slice(0, 2);
  const lastTwo = localPart.slice(-2);

  return `${firstTwo}***${lastTwo}${domainPart}`;
}

function getSeenPracticePhrases(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const storedValue = window.sessionStorage.getItem(
      practicePhraseSeenStorageKey
    );
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];

    return Array.isArray(parsedValue)
      ? parsedValue.filter(
          (phrase): phrase is string => typeof phrase === "string"
        )
      : [];
  } catch {
    return [];
  }
}

function setSeenPracticePhrases(phrases: string[]) {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(
    practicePhraseSeenStorageKey,
    JSON.stringify(phrases)
  );
}

export const getShuffledPhrases = (practicePhrases: string[]) => {
  const selection = selectPracticePhrases(
    practicePhrases,
    getSeenPracticePhrases()
  );

  setSeenPracticePhrases(selection.seenPhrases);

  return selection.phrases;
};
