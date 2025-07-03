// app/callback/page.tsx
"use client";

import Image from "next/image";
import { LoaderCircleIcon } from "lucide-react";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function CallbackPage() {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-950 gap-4">
      <div className="animate-spin">
        <LoaderCircleIcon className="w-6 h-6 text-orange-500" />
      </div>

      <h1 className="text-2xl font-bold text-white">
        <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          Typeala
        </span>
      </h1>

      <AuthenticateWithRedirectCallback />

      {/* Clerk Captcha Container */}
      <div id="clerk-captcha"></div>
    </div>
  );
}
