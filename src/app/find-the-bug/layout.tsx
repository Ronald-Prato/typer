import { MainLayout } from "@/components/layouts";

export default function FindTheBugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
