"use client";

import { useProductionVersionToast } from "@/hooks/useProductionVersionToast";

export function ProductionVersionToast() {
  useProductionVersionToast();

  return null;
}
