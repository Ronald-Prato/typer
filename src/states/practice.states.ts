import { atomWithReset } from "jotai/utils";

export const practiceAtom = atomWithReset({
  phrases: [] as string[],
});
