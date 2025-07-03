import {
  practiceLettersAndSymbols,
  practicePhrases,
  practiceWords,
} from "../../src/constants";
import type { QueryCtx } from "../_generated/server";

export const getCurrentUser = async (ctx: QueryCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("user")
    .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
    .first();

  if (!user) throw new Error("User not found");

  return user;
};

export const getRandomGameSettings = () => {
  const phrase =
    practicePhrases[Math.floor(Math.random() * practicePhrases.length)];
  const words = Array.from(
    { length: 6 },
    () => practiceWords[Math.floor(Math.random() * practiceWords.length)]
  );
  const lettersAndSymbols = Array.from({ length: 6 }, (_, index) => ({
    letter:
      practiceLettersAndSymbols[
        Math.floor(Math.random() * practiceLettersAndSymbols.length)
      ],
    position: index,
  }));
  const holdsWords = Array.from({ length: 6 }, () => ({
    word: practiceWords[Math.floor(Math.random() * practiceWords.length)],
    number: Math.floor(Math.random() * 10),
  }));

  return { phrase, words, lettersAndSymbols, holdsWords };
};
