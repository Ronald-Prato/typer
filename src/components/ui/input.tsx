import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "flex h-12 w-full min-w-0 rounded-lg border-2 bg-black/60 backdrop-blur-sm px-4 py-3 text-base transition-all duration-200 outline-none",
        // Text and placeholder styles
        "text-white placeholder:text-gray-400 font-medium",
        // Border and focus styles - Fortnite blue glow
        "border-blue-500/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:shadow-lg focus:shadow-blue-400/20",
        // Hover effects
        "hover:border-blue-400/70 hover:bg-black/70",
        // Selection styles
        "selection:bg-blue-400 selection:text-black",
        // File input styles
        "file:inline-flex file:h-8 file:border-0 file:bg-gradient-to-r file:from-blue-500 file:to-blue-600 file:text-white file:text-sm file:font-bold file:rounded file:px-3 file:py-1 file:mr-3 file:uppercase file:tracking-wide file:cursor-pointer file:hover:from-blue-400 file:hover:to-blue-500",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-800/50",
        // Error state - Red glow like Fortnite
        "aria-invalid:border-red-500 aria-invalid:focus:border-red-400 aria-invalid:focus:ring-red-400/30 aria-invalid:focus:shadow-red-400/20",
        // Special input types
        "data-[type=email]:border-purple-500/50 data-[type=email]:focus:border-purple-400 data-[type=email]:focus:ring-purple-400/30",
        "data-[type=password]:border-orange-500/50 data-[type=password]:focus:border-orange-400 data-[type=password]:focus:ring-orange-400/30",
        className
      )}
      {...props}
    />
  );
}

export { Input };
