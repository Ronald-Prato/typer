"use client";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { MatchHistory } from "@/components/domains/MatchHistory";
import { Profile } from "@/components/domains/home";
import { Home } from "@/components/domains/home/Home";

function HomeLoadingState() {
  return (
    <section className="relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden px-8 text-[var(--tw-home-fg)]">
      <div className="pointer-events-none absolute left-1/2 top-[45%] h-[31rem] w-[31rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-500/10" />
      <div className="pointer-events-none absolute left-1/2 top-[45%] h-[25rem] w-[25rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[var(--tw-home-border)]" />
      <div className="pointer-events-none absolute left-1/2 top-[45%] h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-500/20" />

      <div className="relative flex w-full max-w-[36rem] flex-col items-center">
        <div className="relative size-[18rem] rotate-45">
          <div className="absolute inset-0 rounded-[3.8rem] bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 p-[0.55rem] opacity-90 shadow-[0_0_56px_rgba(249,115,22,0.2)]">
            <div className="grid size-full place-items-center rounded-[3.25rem] border border-[var(--tw-home-border)] bg-[color-mix(in_srgb,var(--tw-home-panel-strong)_92%,black)] shadow-[inset_0_0_38px_rgba(255,255,255,0.04)]">
              <div className="flex -rotate-45 flex-col items-center text-center">
                <div className="relative mb-5 size-12">
                  <span className="absolute inset-0 rounded-full border-4 border-orange-500/20" />
                  <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-orange-500" />
                </div>
                <p className="text-3xl font-black tracking-tight text-[var(--tw-home-fg)]">
                  Cargando
                </p>
                <p className="mt-3 text-base font-bold text-[var(--tw-home-muted)]">
                  Preparando tu arena
                </p>
              </div>
            </div>
          </div>
          <span className="absolute -inset-7 rounded-full border border-orange-500/20 opacity-80" />
          <span className="absolute -inset-11 rounded-full border border-dashed border-[var(--tw-home-border)]" />
        </div>

        <div className="mt-12 flex overflow-hidden rounded-xl border border-[var(--tw-home-border)] bg-[var(--tw-home-panel-strong)] shadow-[var(--tw-home-shadow)] backdrop-blur">
          <div className="min-w-36 border-r border-[var(--tw-home-border)] px-7 py-3.5 text-center">
            <div className="mx-auto h-3 w-12 animate-pulse rounded-full bg-orange-500/20" />
            <div className="mx-auto mt-3 h-6 w-10 animate-pulse rounded-full bg-[var(--tw-home-border)]" />
          </div>
          <div className="min-w-36 px-7 py-3.5 text-center">
            <div className="mx-auto h-3 w-16 animate-pulse rounded-full bg-orange-500/20" />
            <div className="mx-auto mt-3 h-6 w-10 animate-pulse rounded-full bg-[var(--tw-home-border)]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useUser();

  // Get the current tab from URL parameters
  const currentTab = searchParams.get("tab") || "home";

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/login");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return <HomeLoadingState />;
  }

  if (!isSignedIn) {
    return null; // Will redirect to login
  }

  return (
    <div className="h-full text-white relative flex flex-col items-center">
      {currentTab === "history" ? (
        // Show MatchHistory when tab=history
        <div className="w-full">
          <MatchHistory />
        </div>
      ) : currentTab === "profile" ? (
        <div className="w-full">
          <Profile />
        </div>
      ) : (
        // Show Home component for default tab or home tab
        <Home />
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeLoadingState />}>
      <HomePageContent />
    </Suspense>
  );
}
