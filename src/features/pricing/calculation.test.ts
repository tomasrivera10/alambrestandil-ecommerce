import { describe, expect, it } from "vitest";
import { grossMargin, marketEstimate, suggestPrice, variantIdentity } from "./calculation";
describe("pricing decisions", () => {
  it("uses gross margin rather than markup for cheap accessories and expensive products", () => {
    expect(grossMargin(20, 100)).toBe(80);
    expect(suggestPrice(20, 80, null)?.price).toBe(100);
    expect(suggestPrice(60000, 25, null)?.price).toBe(80000);
  });
  it("keeps the floor when the market cannot sustain the confirmed margin", () => {
    expect(suggestPrice(600, 40, 800)).toEqual({
      floor: 1000,
      price: 1000,
      aboveMarket: true,
      costOnly: false,
    });
    expect(suggestPrice(600, 40, 1100)?.price).toBe(1100);
    expect(suggestPrice(600, null, 1100)).toBeNull();
  });
  it("requires three fresh verified independent sellers and excludes extreme observations", () => {
    const sample = (id: string, price: number, seller = id) => ({
      id,
      price,
      seller,
      verified: true,
      fresh: true,
    });
    expect(marketEstimate([sample("1", 100), sample("2", 110)]).average).toBeNull();
    expect(
      marketEstimate([
        sample("1", 100),
        sample("2", 110),
        sample("3", 120),
        sample("4", 9999),
        sample("5", 105, "1"),
      ]).average,
    ).toBe(110);
    expect(
      marketEstimate([sample("1", 100), sample("2", 110), { ...sample("3", 120), fresh: false }])
        .average,
    ).toBeNull();
  });
  it("invalidates verified matches when product attributes change", () => {
    const variant = {
      name: "1.5 m",
      attributes: { calibre: "14" },
      salesUnit: null,
      product: { name: "Tejido", brand: "Marca", salesUnit: "ROLLO" },
    };
    expect(variantIdentity(variant)).not.toBe(
      variantIdentity({ ...variant, attributes: { calibre: "16" } }),
    );
  });
});
