"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface DrawerProps {
  open: boolean;
  name: string;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DrawerContentProps {
  className?: string;
  children: React.ReactNode;
  open: boolean;
  isAnimatingIn: boolean;
  isClosing: boolean;
}

interface DrawerTitleProps {
  className?: string;
  children: React.ReactNode;
}

const Drawer = ({ open, onOpenChange, name, children }: DrawerProps) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    } else {
      window.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (open) {
      setIsVisible(true);
      setIsClosing(false);
      // Small delay to ensure the drawer renders off-screen first
      const timer = setTimeout(() => {
        setIsAnimatingIn(true);
      }, 10);
      return () => clearTimeout(timer);
    } else if (isVisible) {
      setIsAnimatingIn(false);
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 300); // Duration should match the CSS transition
      return () => clearTimeout(timer);
    }
  }, [open, isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        data-slot="drawer-overlay"
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-md transition-opacity duration-75",
          isAnimatingIn && !isClosing ? "opacity-100" : "opacity-0"
        )}
        onClick={() => onOpenChange(false)}
      />

      {/* Drawer Container */}
      <div
        data-slot="drawer"
        data-state={open ? "open" : "closed"}
        className="fixed inset-0 z-50 pointer-events-none"
      >
        <DrawerContent
          open={open}
          isAnimatingIn={isAnimatingIn}
          isClosing={isClosing}
        >
          <VisuallyHidden>
            <DrawerTitle>{name}</DrawerTitle>
          </VisuallyHidden>
          {children}
        </DrawerContent>
      </div>
    </>
  );
};

const DrawerContent = ({
  className,
  children,
  open,
  isAnimatingIn,
  isClosing,
}: DrawerContentProps) => {
  return (
    <div
      data-slot="drawer-content"
      className={cn(
        "min-w-[30rem] group/drawer-content bg-background fixed z-50 flex h-full flex-col rounded-l-md overflow-hidden pointer-events-auto",
        "inset-y-0 right-0 w-3/4 sm:max-w-sm",
        "transform transition-all ease-in-out duration-300",
        isAnimatingIn && !isClosing
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0",
        className
      )}
    >
      <div className="bg-mute mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
};

const DrawerTitle = ({ className, children }: DrawerTitleProps) => {
  return (
    <h2
      data-slot="drawer-title"
      className={cn("text-foreground font-semibold", className)}
    >
      {children}
    </h2>
  );
};

export { Drawer, DrawerContent, DrawerTitle };
