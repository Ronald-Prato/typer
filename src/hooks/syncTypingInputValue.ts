"use client";

export function syncTypingInputValue(
  input: HTMLInputElement | null | undefined,
  acceptedValue: string
) {
  if (!input) return;

  if (input.value !== acceptedValue) {
    input.value = acceptedValue;
  }
}
