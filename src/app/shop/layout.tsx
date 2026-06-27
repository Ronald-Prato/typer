"use client";

import { MainLayout } from "@/components/layouts";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
