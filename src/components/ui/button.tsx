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

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  const isDisabled = loading || props.disabled;

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

export { Button, buttonVariants };
