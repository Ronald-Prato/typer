"use client";

import type { ReactNode } from "react";
import { useLowPerformanceMode } from "@/hooks";

export function PerformanceModeProvider({
  children,
}: {
  children: ReactNode;
}) {
  useLowPerformanceMode();

  return children;
}

