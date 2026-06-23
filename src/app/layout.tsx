import "../styles/globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { ProductionVersionToast } from "@/components/ProductionVersionToast";
import { Geist, Geist_Mono } from "next/font/google";
import ConvexClientProvider from "./convex.client.provider";
import { AuthProvider } from "../components/providers/AuthProvider";
import { HudScaleProvider } from "@/components/providers/HudScaleProvider";
import { MotionProvider } from "@/motion";
import { PerformanceModeProvider } from "@/components/providers/PerformanceModeProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "typewars.io",
  description: "Retos de programación diarios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-screen overflow-hidden antialiased`}
      >
        <ClerkProvider afterSignOutUrl="/login">
          <ThemeProvider>
            <ConvexClientProvider>
              <AuthProvider>
                <PerformanceModeProvider>
                  <MotionProvider>
                    <HudScaleProvider>
                      {children}
                      <ProductionVersionToast />
                      <Toaster />
                    </HudScaleProvider>
                  </MotionProvider>
                </PerformanceModeProvider>
              </AuthProvider>
            </ConvexClientProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
