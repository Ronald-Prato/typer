import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow hover:from-orange-600 hover:to-red-600 active:from-orange-700 active:to-red-700 py-4",
        destructive:
          "bg-red-500 text-white shadow hover:bg-red-600 active:bg-red-700",
        outline:
          "border border-gray-700 bg-transparent text-gray-300 shadow-sm hover:bg-gray-800 hover:text-white hover:border-gray-600",
        secondary: "bg-gray-800 text-gray-100 shadow-sm hover:bg-gray-700",
        ghost: "text-gray-300 hover:bg-gray-800 hover:text-white",
        link: "text-orange-500 underline-offset-4 hover:underline hover:text-orange-400",
      },
      size: {
        default: "h-9 px-4 py-6",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-lg px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  shortcut?: string;
  onShortcutPress?: () => void;
}

// Component to display keyboard shortcut indicator
interface KeyIndicatorProps {
  shortcut: string;
  size?: "sm" | "base" | "lg";
  className?: string;
}

const keyIndicatorVariants = cva(
  "bg-white/20 backdrop-blur-sm text-white font-medium rounded flex items-center justify-center border border-white/30",
  {
    variants: {
      size: {
        sm: "w-9 h-4.5 text-[10px]",
        base: "w-12 h-6 text-xs",
        lg: "w-16 h-8 text-sm",
      },
    },
    defaultVariants: {
      size: "base",
    },
  }
);

function KeyIndicator({
  shortcut,
  size = "base",
  className,
}: KeyIndicatorProps) {
  const [isMacOS, setIsMacOS] = React.useState(false);

  React.useEffect(() => {
    setIsMacOS(
      typeof window !== "undefined" &&
        navigator.platform.toUpperCase().indexOf("MAC") >= 0
    );
  }, []);

  const formatShortcut = (shortcut: string) => {
    const keys = shortcut.toLowerCase().split("+");
    const isMacOS =
      typeof window !== "undefined" &&
      navigator.platform.toUpperCase().indexOf("MAC") >= 0;

    return keys
      .map((key) => {
        if (key === "cmd" && isMacOS) return "⌘";
        if (key === "ctrl" && !isMacOS) return "Ctrl";
        if (key === "shift") return "Shift";
        if (key === "alt") return "Alt";
        return key.toUpperCase();
      })
      .join(" ");
  };

  return (
    <div
      className={cn(keyIndicatorVariants({ size }), className)}
      style={{
        boxShadow:
          "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
      }}
    >
      {formatShortcut(shortcut)}
    </div>
  );
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  shortcut,
  onShortcutPress,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  const isDisabled = loading || props.disabled;

  // Handle keyboard shortcuts
  React.useEffect(() => {
    if (!shortcut || !onShortcutPress) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Parse shortcut (e.g., "Cmd+J", "Ctrl+K", "Enter")
      const keys = shortcut.toLowerCase().split("+");
      const isMacOS =
        typeof window !== "undefined" &&
        navigator.platform.toUpperCase().indexOf("MAC") >= 0;

      // Check modifier keys
      const hasCmd = keys.includes("cmd") && event.metaKey;
      const hasCtrl = keys.includes("ctrl") && event.ctrlKey;
      const hasShift = keys.includes("shift") && event.shiftKey;
      const hasAlt = keys.includes("alt") && event.altKey;

      // Check main key
      const mainKey = keys.find(
        (key) => !["cmd", "ctrl", "shift", "alt"].includes(key)
      );
      const keyMatches = mainKey && event.key.toLowerCase() === mainKey;

      // Handle platform-specific modifiers
      const modifierMatches = isMacOS ? hasCmd : hasCtrl;

      if (keyMatches && modifierMatches && !hasShift && !hasAlt) {
        event.preventDefault();
        event.stopPropagation();
        onShortcutPress();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [shortcut, onShortcutPress]);

  return (
    <Comp
      className={cn(
        buttonVariants({ variant, size }),
        isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants, KeyIndicator };
export type { ButtonProps, KeyIndicatorProps };
