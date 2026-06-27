import { describe, expect, it } from "vitest";
import {
  getFeaturedShopItem,
  getShopItemsByKind,
  SHOP_CATALOG,
  SHOP_CATEGORIES,
} from "./shopCatalog";

describe("shopCatalog", () => {
  it("keeps the v1 shop organized around the expected sections", () => {
    expect(SHOP_CATEGORIES.map((category) => category.key)).toEqual([
      "featured",
      "sounds",
    ]);
  });

  it("selects one featured item outside the regular rows", () => {
    const featured = getFeaturedShopItem();

    expect(featured?.id).toBe("mechanical-pack");
    expect(getShopItemsByKind("sound")).not.toContain(featured);
  });

  it("keeps every sellable item priced and categorized", () => {
    for (const item of SHOP_CATALOG) {
      expect(item.id).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.price).toBeGreaterThanOrEqual(0);
      expect(item.kind).toBe("sound");
    }
  });
});
