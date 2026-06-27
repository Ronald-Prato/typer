export type ShopCategoryKey = "featured" | "sounds";

export type ShopItemKind = "sound";

export interface ShopCategory {
  key: ShopCategoryKey;
  label: string;
}

export interface ShopItem {
  id: string;
  kind: ShopItemKind;
  title: string;
  kicker: string;
  description: string;
  price: number;
  featured?: boolean;
}

export const SHOP_CATEGORIES: ShopCategory[] = [
  { key: "featured", label: "Destacado" },
  { key: "sounds", label: "Sonidos" },
];

export const SHOP_CATALOG: ShopItem[] = [
  {
    id: "mechanical-pack",
    kind: "sound",
    title: "Pack Mecánico",
    kicker: "Sonidos de tecleado",
    description: "Click pesado, rebote metálico y final de combo.",
    price: 250,
    featured: true,
  },
  {
    id: "mechanical-click",
    kind: "sound",
    title: "Click Mecánico",
    kicker: "Switch azul",
    description: "Táctil, brillante y con pegada.",
    price: 90,
  },
  {
    id: "retro-pop",
    kind: "sound",
    title: "Retro Pop",
    kicker: "Arcade",
    description: "Pops cortos para rachas rápidas.",
    price: 120,
  },
  {
    id: "zen-silence",
    kind: "sound",
    title: "Silencio Zen",
    kicker: "Minimal",
    description: "Sonido suave para focus largo.",
    price: 75,
  },
  {
    id: "soft-type",
    kind: "sound",
    title: "Soft Type",
    kicker: "Bajo impacto",
    description: "Tecleado ligero para sesiones tranquilas.",
    price: 80,
  },
  {
    id: "office-keys",
    kind: "sound",
    title: "Office Keys",
    kicker: "Clásico",
    description: "Sonido limpio de teclado de oficina.",
    price: 100,
  },
];

export function getFeaturedShopItem(items: ShopItem[] = SHOP_CATALOG) {
  return items.find((item) => item.featured) ?? null;
}

export function getShopItemsByKind(
  kind: ShopItemKind,
  items: ShopItem[] = SHOP_CATALOG
) {
  return items.filter((item) => item.kind === kind && !item.featured);
}
