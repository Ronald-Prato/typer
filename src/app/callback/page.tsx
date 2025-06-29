// app/callback/page.tsx
"use client";

import Image from "next/image";
import { LoaderCircleIcon } from "lucide-react";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function CallbackPage() {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-neutral-50 gap-4">
      <div className="animate-spin">
        <LoaderCircleIcon className="w-6 h-6 text-primary-main" />
      </div>

      <Image
        src="/assets/img/dev11isometric.png"
        alt="Dev 11 Logo"
        width={250}
        height={250}
      />

      <AuthenticateWithRedirectCallback />
    </div>
  );
}
