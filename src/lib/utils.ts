import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { practicePhrases } from "@/constants";

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

export const getShuffledPhrases = () => {
  // Crear una copia del arreglo para no mutar el original
  const shuffled = [...practicePhrases];

  // Algoritmo Fisher-Yates para mezclar completamente
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Tomar las primeras 5 frases del arreglo completamente mezclado
  return shuffled.slice(0, 5);
};
