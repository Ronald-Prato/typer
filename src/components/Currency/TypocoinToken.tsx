import Image from "next/image";

import { cn } from "@/lib/utils";

type TypocoinTokenSize = number | "sm" | "md" | "lg";

interface TypocoinTokenProps {
  size?: TypocoinTokenSize;
  className?: string;
}

const tokenSizeByName = {
  sm: 22,
  md: 28,
  lg: 38,
} as const;

function resolveTokenSize(size: TypocoinTokenSize) {
  return typeof size === "number" ? size : tokenSizeByName[size];
}

export function TypocoinToken({
  size = "md",
  className,
}: TypocoinTokenProps) {
  const resolvedSize = resolveTokenSize(size);

  return (
    <Image
      alt=""
      aria-hidden="true"
      className={cn(
        "shrink-0 drop-shadow-[0_4px_7px_rgba(14,116,144,0.34)]",
        className
      )}
      draggable={false}
      height={resolvedSize}
      src="/assets/svg/icons/typocoin-token.svg"
      unoptimized
      width={resolvedSize}
    />
  );
}
