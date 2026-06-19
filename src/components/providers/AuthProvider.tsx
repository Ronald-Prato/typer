"use client";

import { useUser } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user: clerkUser, isLoaded } = useUser();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  const dbUser = useCurrentUser();

  useEffect(() => {
    if (isLoaded && clerkUser && isAuthenticated && dbUser === null) {
      // User is authenticated but doesn't exist in Convex
      // Redirect to welcome page to create profile
      router.push("/welcome");
    }
  }, [clerkUser, dbUser, isAuthenticated, isLoaded, router]);

  return <>{children}</>;
}
