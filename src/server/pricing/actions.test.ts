import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({
  update: vi.fn(),
  audit: vi.fn(),
  item: vi.fn(),
  variant: vi.fn(),
  pricing: vi.fn(),
}));
vi.mock("@/server/rbac", () => ({ requireArea: async () => ({ userId: "owner" }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/products/cache", () => ({ invalidateCatalog: vi.fn() }));
vi.mock("./queries", () => ({ pricingForVariant: mock.pricing }));
vi.mock("@/server/db", () => ({
  prisma: {
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        supplierItem: { findUniqueOrThrow: mock.item },
        productVariant: { findUniqueOrThrow: mock.variant, update: mock.update },
        priceChange: { create: mock.audit },
      }),
  },
}));
import { publishVariantPrice } from "./actions";
const form = () => {
  const data = new FormData();
  for (const [k, v] of Object.entries({
    variantId: "v",
    supplierItemId: "s",
    price: "102,50",
    confirm: "on",
    expectedCost: "20.5",
    expectedPrice: "",
  }))
    data.set(k, v);
  return data;
};
beforeEach(() => {
  vi.clearAllMocks();
  mock.pricing.mockResolvedValue({
    selected: { id: "s" },
    cost: 20.5,
    policy: { margin: 80 },
    market: { average: null },
  });
  mock.item.mockResolvedValue({ variantId: "v", listPrice: 20.5, purchased: true });
  mock.variant.mockResolvedValue({
    price: null,
    active: true,
    sourceReference: "Alambres Tandil.xlsx · Stock!A3:B3",
    product: { price: null },
  });
});
describe("confirmed price changes", () => {
  it("cannot apply a price without the explicit confirmation", async () => {
    const data = form();
    data.delete("confirm");
    await expect(publishVariantPrice(data)).rejects.toThrow("Confirmá");
    expect(mock.update).not.toHaveBeenCalled();
  });
  it("rejects a stale cost and does not overwrite a newer price", async () => {
    mock.item.mockResolvedValue({ variantId: "v", listPrice: 25, purchased: true });
    await expect(publishVariantPrice(form())).rejects.toThrow("cambió");
    expect(mock.update).not.toHaveBeenCalled();
    mock.item.mockResolvedValue({ variantId: "v", listPrice: 20.5, purchased: true });
    mock.variant.mockResolvedValue({
      price: 200,
      active: true,
      sourceReference: "Alambres Tandil.xlsx · Stock!A3:B3",
      product: { price: null },
    });
    await expect(publishVariantPrice(form())).rejects.toThrow("cambió");
  });
  it("stores the actual cost and resulting margin with the confirmed price", async () => {
    await publishVariantPrice(form());
    expect(mock.audit).toHaveBeenCalledWith({
      data: expect.objectContaining({ newPrice: 102.5, cost: 20.5, margin: 80, userId: "owner" }),
    });
  });
  it("does not price supplier-only products or articles the company does not buy", async () => {
    mock.variant.mockResolvedValue({
      price: null,
      active: true,
      sourceReference: null,
      product: { price: null },
    });
    await expect(publishVariantPrice(form())).rejects.toThrow("Solo se puede fijar");
    mock.variant.mockResolvedValue({
      price: null,
      active: true,
      sourceReference: "Alambres Tandil.xlsx · Stock!A3:B3",
      product: { price: null },
    });
    mock.item.mockResolvedValue({ variantId: "v", listPrice: 20.5, purchased: false });
    await expect(publishVariantPrice(form())).rejects.toThrow("Solo se puede fijar");
    expect(mock.update).not.toHaveBeenCalled();
  });
});
