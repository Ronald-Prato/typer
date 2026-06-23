"use client";

import { createContext, useContext } from "react";

interface MainLayoutChromeContextValue {
  setIsGameChromeHidden: (hidden: boolean) => void;
}

const fallbackChromeContext: MainLayoutChromeContextValue = {
  setIsGameChromeHidden: () => undefined,
};

export const MainLayoutChromeContext =
  createContext<MainLayoutChromeContextValue>(fallbackChromeContext);

export function useMainLayoutChrome() {
  return useContext(MainLayoutChromeContext);
}
