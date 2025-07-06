"use client";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { MatchHistory } from "@/components/domains/MatchHistory";
import { Profile } from "@/components/domains/home";
import { Home } from "@/components/domains/home/Home";

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
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
