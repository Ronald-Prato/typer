import { describe, expect, it } from "vitest";

import {
  TYPOCOIN_REWARD_FOR_1V1_WIN,
  formatTypocoinAmount,
  formatTypocoinLabel,
  getTypocoinBalanceFromUser,
} from "./currency";

describe("currency", () => {
  it("formats zero and positive typocoin balances", () => {
    expect(formatTypocoinLabel(0)).toBe("0 typocoins");
    expect(formatTypocoinLabel(1250)).toBe("1.250 typocoins");
  });

  it("formats signed typocoin rewards", () => {
    expect(formatTypocoinLabel(10, { signed: true })).toBe("+10 typocoins");
    expect(formatTypocoinAmount(0, { signed: true })).toBe("0");
  });

  it("maps the legacy gold field to a typocoin balance", () => {
    expect(getTypocoinBalanceFromUser({ gold: 12 })).toBe(12);
    expect(getTypocoinBalanceFromUser({})).toBe(0);
    expect(getTypocoinBalanceFromUser(null)).toBe(0);
  });

  it("keeps the 1v1 winner reward at 10 typocoins", () => {
    expect(TYPOCOIN_REWARD_FOR_1V1_WIN).toBe(10);
  });
});
