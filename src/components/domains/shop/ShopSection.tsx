"use client";

import { type ShopItem } from "@/domain/shopCatalog";
import { ShopItemTile } from "./ShopItemTile";

type ShopSectionProps = {
  title: string;
  items: ShopItem[];
};

export function ShopSection({
  items,
  title,
}: ShopSectionProps) {
  return (
    <section className="relative">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-xl font-black text-[var(--tw-home-fg)]">{title}</h2>
        <span className="h-px min-w-12 flex-1 bg-[linear-gradient(90deg,var(--tw-home-border),transparent)]" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <ShopItemTile
            key={item.id}
            item={item}
          />
        ))}
      </div>
    </section>
  );
}
