"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user: clerkUser, isLoaded } = useUser();
  const router = useRouter();

  // Always call useQuery to maintain hook order
  const dbUser = useQuery(api.user.getOwnUser);

  useEffect(() => {
    if (isLoaded && clerkUser && dbUser === null) {
      // User is authenticated but doesn't exist in Convex
      // Redirect to welcome page to create profile
      router.push("/welcome");
    }
  }, [clerkUser, isLoaded, dbUser, router]);

  return <>{children}</>;
}
