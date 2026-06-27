"use client";

import { Clock3, Music2, ShoppingBag } from "lucide-react";
import {
  getFeaturedShopItem,
  getShopItemsByKind,
  SHOP_CATEGORIES,
} from "@/domain/shopCatalog";
import { cn } from "@/lib/utils";
import { ShopItemTile } from "./ShopItemTile";
import { ShopSection } from "./ShopSection";

type ShopViewProps = {
  className?: string;
};

const featuredItem = getFeaturedShopItem();
const soundItems = getShopItemsByKind("sound");
const highlightedSoundItems = soundItems.slice(0, 2);
const remainingSoundItems = soundItems.slice(2);

export function ShopView({ className }: ShopViewProps) {
  return (
    <section
      className={cn(
        "relative h-full min-h-0 w-full overflow-y-auto overflow-x-hidden px-2 pb-8 pt-6 text-[var(--tw-home-fg)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(87,82,121,0.12),transparent_42%),linear-gradient(180deg,rgba(15,23,42,0.06),transparent_30%,rgba(15,23,42,0.05))]" />
      <div className="pointer-events-none absolute left-[5%] top-[18%] hidden rotate-[-14deg] grid-cols-3 gap-2 opacity-20 md:grid">
        {["Esc", "Q", "W", "A", "S", "D"].map((keycap) => (
          <span
            key={keycap}
            className="grid size-12 place-items-center rounded-md border border-[var(--tw-home-border)] bg-[var(--tw-home-panel-strong)] text-xs font-black text-[var(--tw-home-muted)]"
          >
            {keycap}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute right-[4%] top-[26%] hidden rotate-12 grid-cols-2 gap-2 opacity-20 lg:grid">
        {["⌘", "I", "Enter", "Tab"].map((keycap) => (
          <span
            key={keycap}
            className="grid h-12 min-w-16 place-items-center rounded-md border border-[var(--tw-home-border)] bg-[var(--tw-home-panel-strong)] px-3 text-xs font-black text-[var(--tw-home-muted)]"
          >
            {keycap}
          </span>
        ))}
      </div>

      <div className="relative mx-auto flex w-full max-w-[88rem] flex-col gap-7">
        <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[var(--tw-home-muted)]">
              <ShoppingBag className="size-4" />
              Item shop
            </div>
            <h1 className="mt-3 text-5xl font-black leading-none tracking-tight text-[var(--tw-home-fg)] md:text-7xl">
              Tienda
            </h1>
            <p className="mt-3 max-w-2xl text-base font-bold text-[var(--tw-home-muted)] md:text-lg">
              Compra sonidos de tecleado para personalizar tus partidas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] px-4 py-2 text-sm font-black text-[var(--tw-home-muted)]">
              <Clock3 className="size-4" />
              Renueva en 12h
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] px-4 py-2 text-sm font-black text-[var(--tw-home-muted)]">
              <Music2 className="size-4" />
              Sonidos v1
            </div>
          </div>
        </header>

        <nav
          aria-label="Categorías de tienda"
          className="flex min-h-12 gap-2 overflow-x-auto pb-1"
        >
          {SHOP_CATEGORIES.map((category, index) => (
            <a
              key={category.key}
              className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-full border px-5 py-2 text-sm font-black uppercase tracking-wide transition-colors",
                index === 0
                  ? "border-[color-mix(in_srgb,var(--tw-home-fg)_28%,transparent)] bg-[var(--tw-home-fg)] text-[var(--tw-home-bg)] shadow-[0_16px_38px_color-mix(in_srgb,var(--tw-home-fg)_14%,transparent)]"
                  : "border-[var(--tw-home-border)] bg-[color-mix(in_srgb,var(--tw-home-panel)_58%,transparent)] text-[var(--tw-home-fg)] hover:border-[color-mix(in_srgb,var(--tw-home-fg)_32%,transparent)]"
              )}
              href={`#${category.key}`}
            >
              {category.label}
            </a>
          ))}
        </nav>

        <div id="featured" className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
          {featuredItem ? (
            <ShopItemTile
              item={featuredItem}
              size="featured"
            />
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            {highlightedSoundItems.map((item) => (
              <ShopItemTile
                key={item.id}
                item={item}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-8">
          <div id="sounds">
            <ShopSection
              items={remainingSoundItems}
              title="Más sonidos"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
