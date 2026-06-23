import { formatTypocoinAmount, formatTypocoinLabel } from "@/domain/currency";
import { cn } from "@/lib/utils";
import { TypocoinToken } from "./TypocoinToken";

interface TypocoinBalanceProps {
  amount: number;
  size?: "compact" | "drawer";
  showLabel?: boolean;
  signed?: boolean;
  className?: string;
}

const balanceStyles = {
  compact:
    "rounded-full border border-cyan-700/35 bg-white/80 px-2.5 py-1.5 text-cyan-950 shadow-[0_10px_30px_rgba(15,118,110,0.18),inset_0_1px_0_rgba(255,255,255,0.82),inset_0_-1px_0_rgba(15,118,110,0.12)] backdrop-blur-2xl dark:border-cyan-200/20 dark:bg-cyan-300/10 dark:text-cyan-50 dark:shadow-[0_14px_32px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.14)]",
  drawer:
    "rounded-md border border-cyan-700/30 bg-white/70 px-2 py-1 text-sm text-cyan-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] dark:border-cyan-200/20 dark:bg-cyan-300/10 dark:text-cyan-100",
} as const;

const tokenSizes = {
  compact: "md",
  drawer: "sm",
} as const;

export function TypocoinBalance({
  amount,
  size = "compact",
  showLabel = true,
  signed = false,
  className,
}: TypocoinBalanceProps) {
  const label = formatTypocoinLabel(amount, { signed });

  return (
    <div
      aria-label={label}
      className={cn(
        "inline-flex min-w-0 shrink-0 items-center gap-2 font-extrabold leading-none",
        balanceStyles[size],
        className
      )}
      role="status"
    >
      <TypocoinToken size={tokenSizes[size]} />
      <span className="tabular-nums">
        {formatTypocoinAmount(amount, { signed })}
      </span>
      {showLabel ? (
        <span className="text-xs font-black uppercase tracking-wide">
          typocoins
        </span>
      ) : null}
    </div>
  );
}
