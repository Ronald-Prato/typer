import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
