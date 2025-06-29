import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Base styles
        "flex field-sizing-content min-h-20 w-full rounded-lg border-2 bg-black/60 backdrop-blur-sm px-4 py-3 text-base transition-all duration-200 outline-none resize-vertical",
        // Text and placeholder styles
        "text-white placeholder:text-gray-400 font-medium leading-relaxed",
        // Border and focus styles - Fortnite blue glow
        "border-blue-500/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:shadow-lg focus:shadow-blue-400/20",
        // Hover effects
        "hover:border-blue-400/70 hover:bg-black/70",
        // Selection styles
        "selection:bg-blue-400 selection:text-black",
        // Scrollbar styling
        "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-blue-500/50 hover:scrollbar-thumb-blue-400/70",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-800/50",
        // Error state - Red glow like Fortnite
        "aria-invalid:border-red-500 aria-invalid:focus:border-red-400 aria-invalid:focus:ring-red-400/30 aria-invalid:focus:shadow-red-400/20",
        // Focus within for better UX
        "focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/30",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
