import { describe, expect, it } from "vitest";
import { priceValue, imageUrl } from "./validation";
import catalog from "../../../prisma/catalog.json";
describe("valores del catálogo", () => {
  it("conserva centavos argentinos y permite vaciar el precio", () => {
    expect(priceValue("12.500,50")).toBe(12500.5);
    expect(priceValue("12500,50")).toBe(12500.5);
    expect(priceValue("")).toBeNull();
    expect(() => priceValue("12.50")).toThrow();
    expect(() => priceValue("-5")).toThrow();
  });
  it("impide protocolos ejecutables y rutas externas ambiguas", () => {
    expect(imageUrl("/uploads/foto.jpg")).toBe("/uploads/foto.jpg");
    expect(() => imageUrl("javascript:alert(1)")).toThrow();
    expect(() => imageUrl("//externo.com/foto")).toThrow();
  });
  it("mantiene 94 referencias únicas sin valores desactualizados", () => {
    const variants = catalog.products.flatMap((p) => p.variants);
    expect(variants).toHaveLength(94);
    expect(new Set(variants.map((v) => v.sku)).size).toBe(94);
    for (const p of catalog.products) {
      expect(p).not.toHaveProperty("price");
      for (const v of p.variants) {
        expect(v).not.toHaveProperty("onHand");
        expect(v).not.toHaveProperty("price");
      }
    }
    expect(variants.filter((v) => !v.active).map((v) => v.sku)).toEqual([
      "AT-XLS-041",
      "AT-XLS-042",
      "AT-XLS-043",
      "AT-XLS-044",
      "AT-XLS-045",
      "AT-XLS-046",
      "AT-XLS-060",
      "AT-XLS-064",
    ]);
  });
});
