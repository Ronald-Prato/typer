"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type HomeBackgroundDashDirection = "left" | "right";

type HomeBackgroundDashRequest = {
  direction: HomeBackgroundDashDirection;
  id: number;
};

type HomeBackgroundDashContextValue = {
  dashRequest: HomeBackgroundDashRequest | null;
  triggerDash: (direction: HomeBackgroundDashDirection) => void;
};

const HomeBackgroundDashContext =
  createContext<HomeBackgroundDashContextValue | null>(null);

export function HomeBackgroundDashProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [dashRequest, setDashRequest] =
    useState<HomeBackgroundDashRequest | null>(null);

  const triggerDash = useCallback((direction: HomeBackgroundDashDirection) => {
    setDashRequest((current) => ({
      direction,
      id: (current?.id ?? 0) + 1,
    }));
  }, []);

  const value = useMemo(
    () => ({
      dashRequest,
      triggerDash,
    }),
    [dashRequest, triggerDash],
  );

  return (
    <HomeBackgroundDashContext.Provider value={value}>
      {children}
    </HomeBackgroundDashContext.Provider>
  );
}

export function useHomeBackgroundDash() {
  return useContext(HomeBackgroundDashContext)?.triggerDash;
}

export function useHomeBackgroundDashRequest() {
  return useContext(HomeBackgroundDashContext)?.dashRequest ?? null;
}
