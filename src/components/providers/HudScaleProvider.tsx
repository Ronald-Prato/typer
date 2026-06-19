"use client";

import type { ReactNode } from "react";
import { useHudScale } from "@/hooks";

export function HudScaleProvider({ children }: { children: ReactNode }) {
  useHudScale();

  return children;
}
