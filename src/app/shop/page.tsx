"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { ShopView } from "@/components/domains/shop";

function ShopLoadingState() {
  return (
    <section className="relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden text-[var(--tw-home-fg)]">
      <div className="grid gap-4 text-center">
        <div className="mx-auto size-16 animate-pulse rounded-lg border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] shadow-[0_18px_48px_color-mix(in_srgb,var(--tw-home-fg)_12%,transparent)]" />
        <p className="text-lg font-black">Cargando tienda</p>
      </div>
    </section>
  );
}

function ShopPageContent() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/login");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return <ShopLoadingState />;
  }

  if (!isSignedIn) {
    return null;
  }

  return <ShopView />;
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopLoadingState />}>
      <ShopPageContent />
    </Suspense>
  );
}
