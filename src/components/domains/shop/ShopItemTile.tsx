"use client";

import { Music2, Play, ShoppingBag } from "lucide-react";
import { TypocoinToken } from "@/components/Currency";
import { type ShopItem } from "@/domain/shopCatalog";
import { cn } from "@/lib/utils";

type ShopItemTileProps = {
  item: ShopItem;
  size?: "featured" | "standard";
};

export function ShopItemTile({
  item,
  size = "standard",
}: ShopItemTileProps) {
  const isFeatured = size === "featured";

  return (
    <article
      className={cn(
        "group relative isolate overflow-hidden rounded-lg border border-[var(--tw-home-border)]",
        "bg-[color-mix(in_srgb,var(--tw-home-panel-strong)_76%,transparent)] text-[var(--tw-home-fg)]",
        "shadow-[0_18px_48px_color-mix(in_srgb,var(--tw-home-fg)_12%,transparent)]",
        isFeatured ? "min-h-[20rem] p-5" : "min-h-[14rem] p-4"
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),transparent_42%),linear-gradient(180deg,transparent,rgba(15,23,42,0.06))]" />
      <div className="absolute right-4 top-4 rounded-full border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] px-3 py-1 text-[0.65rem] font-black uppercase tracking-wide text-[var(--tw-home-muted)]">
        Sonido
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between gap-5">
        <div>
          <p className="max-w-[12rem] text-xs font-black uppercase tracking-[0.18em] text-[var(--tw-home-muted)]">
            {item.kicker}
          </p>
          <h3
            className={cn(
              "mt-2 font-black leading-none tracking-tight text-[var(--tw-home-fg)]",
              isFeatured ? "text-5xl" : "text-2xl"
            )}
          >
            {item.title}
          </h3>
        </div>

        <SoundNotePreview isFeatured={isFeatured} />

        <div className="flex min-w-0 items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-bold leading-snug text-[var(--tw-home-muted)]">
              {item.description}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] px-3 py-1.5 text-sm font-black">
              <TypocoinToken size="sm" className="drop-shadow-none" />
              {item.price}
            </div>
          </div>
          <button
            className="inline-flex shrink-0 items-center gap-2 rounded-md border border-[var(--tw-home-border)] bg-[var(--tw-home-panel-strong)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--tw-home-fg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-colors hover:border-[color-mix(in_srgb,var(--tw-home-fg)_32%,transparent)]"
            type="button"
          >
            <ShoppingBag className="size-4" />
            Comprar
          </button>
        </div>
      </div>
    </article>
  );
}

function SoundNotePreview({ isFeatured }: { isFeatured: boolean }) {
  return (
    <div className="relative grid min-h-24 place-items-center">
      <div
        className={cn(
          "grid place-items-center rounded-lg border border-[var(--tw-home-border)] bg-[color-mix(in_srgb,var(--tw-home-panel)_82%,transparent)] text-[var(--tw-home-muted)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]",
          isFeatured ? "size-36" : "size-24"
        )}
      >
        <Music2
          className={cn(
            "stroke-[1.8]",
            isFeatured ? "size-20" : "size-12"
          )}
        />
      </div>
      <button
        aria-label="Preview sonido"
        className="absolute bottom-0 right-0 grid size-11 place-items-center rounded-full border border-[var(--tw-home-border)] bg-[var(--tw-home-panel-strong)] text-[var(--tw-home-fg)] shadow-lg transition-colors hover:border-[color-mix(in_srgb,var(--tw-home-fg)_32%,transparent)]"
        type="button"
      >
        <Play className="ml-0.5 size-5 fill-current" />
      </button>
    </div>
  );
}
