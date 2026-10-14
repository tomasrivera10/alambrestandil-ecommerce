import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  list: vi.fn(),
  variants: vi.fn(),
  previous: vi.fn(),
  update: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/rbac", () => ({ requireArea: async () => ({ userId: "owner" }) }));
vi.mock("@/server/db", () => ({
  prisma: {
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        supplierPriceList: { findUniqueOrThrow: mock.list, update: mock.update },
        productVariant: { findMany: mock.variants },
        supplierItem: { findMany: mock.previous },
      }),
  },
}));

import { prepareSupplierSelection } from "./actions";

const form = (indices: string[]) => {
  const data = new FormData();
  data.set("listId", "list");
  data.set("confirmed", "on");
  indices.forEach((index) => data.append("selected", index));
  return data;
};

beforeEach(() => {
  vi.clearAllMocks();
  mock.list.mockResolvedValue({
    status: "REVIEW",
    supplierId: "supplier",
    rows: [
      { code: "900", name: 'ROLLO 1½" 10M X 1.50M C/16', price: 91908.28 },
      { code: "901", name: 'ROLLO 2½" 10M X 1.50M C/16', price: 53508 },
    ],
  });
  mock.variants.mockResolvedValue([
    {
      id: "v",
      name: 'Tejido Rombo 2½" 10M X 1.50M C/16',
      salesUnit: "ROLLO",
      sourceReference: "Alambres Tandil.xlsx · Stock!A4:B4",
      product: { salesUnit: "ROLLO" },
    },
  ]);
  mock.previous.mockResolvedValue([]);
});

describe("bulk supplier selection", () => {
  it("excludes the supplier-only item and retains only the exact company product", async () => {
    await prepareSupplierSelection(form(["1"]));
    expect(mock.update).toHaveBeenCalledWith({
      where: { id: "list" },
      data: {
        rows: [
          expect.objectContaining({ code: "900", excluded: true }),
          expect.objectContaining({ code: "901", variantId: "v", unit: "ROLLO", excluded: false }),
        ],
      },
    });
  });

  it("rejects attempts to include an unmatched supplier product", async () => {
    await expect(prepareSupplierSelection(form(["0"]))).rejects.toThrow("requiere revisión");
    expect(mock.update).not.toHaveBeenCalled();
  });
});
