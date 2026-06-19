"use client";

import { MainLayout } from "@/components/layouts";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
