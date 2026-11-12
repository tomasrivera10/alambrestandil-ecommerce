import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  list: vi.fn(),
  variants: vi.fn(),
  previous: vi.fn(),
  update: vi.fn(),
  item: vi.fn(),
  upsert: vi.fn(),
  restore: vi.fn(),
  remove: vi.fn(),
  auth: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/rbac", () => ({ requireArea: mock.auth }));
vi.mock("@/server/db", () => ({
  prisma: {
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        supplierPriceList: { findUniqueOrThrow: mock.list, update: mock.update },
        productVariant: { findMany: mock.variants },
        supplierItem: {
          upsert: mock.upsert,
          findMany: mock.previous,
          findUnique: mock.item,
          update: mock.restore,
          delete: mock.remove,
        },
      }),
  },
}));

import { prepareSupplierSelection, approveSupplierList, rollbackSupplierList } from "./actions";

const form = (indices: string[]) => {
  const data = new FormData();
  data.set("listId", "list");
  data.set("confirmed", "on");
  indices.forEach((index) => data.append("selected", index));
  return data;
};

beforeEach(() => {
  vi.clearAllMocks();
  mock.auth.mockResolvedValue({ userId: "owner" });
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
  it("preserves unresolved rows when preparing the exact company product", async () => {
    await prepareSupplierSelection(form(["1"]));
    expect(mock.update).toHaveBeenCalledWith({
      where: { id: "list" },
      data: {
        rows: [
          expect.objectContaining({ code: "900", price: 91908.28 }),
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

describe("approval safeguards and rollback", () => {
  it("blocks approval of unreviewed rows", async () => {
    await expect(approveSupplierList("list")).rejects.toThrow("Revisá todas");
    expect(mock.update).not.toHaveBeenCalled();
  });
  it("checks server authorization for mutations", async () => {
    mock.auth.mockRejectedValueOnce(new Error("No autorizado"));
    await expect(prepareSupplierSelection(form(["1"]))).rejects.toThrow("No autorizado");
    expect(mock.update).not.toHaveBeenCalled();
  });
  it("restores a saved previous cost", async () => {
    const previousItem = {
      name: "Puerta",
      unit: "UNIDAD",
      listPrice: 100,
      variantId: "v",
      purchased: true,
    };
    mock.list.mockResolvedValue({
      status: "APPROVED",
      supplierId: "supplier",
      rows: [{ appliedItemId: "item", appliedUpdatedAt: "2026-10-16T00:00:00.000Z", previousItem }],
    });
    mock.item.mockResolvedValue({
      id: "item",
      supplierId: "supplier",
      updatedAt: new Date("2026-10-16T00:00:00Z"),
    });
    await rollbackSupplierList(form([]));
    expect(mock.restore).toHaveBeenCalledWith({ where: { id: "item" }, data: previousItem });
    expect(mock.update).toHaveBeenCalledWith({
      where: { id: "list" },
      data: { status: "ROLLED_BACK" },
    });
  });
  it("blocks rollback over a later change", async () => {
    mock.list.mockResolvedValue({
      status: "APPROVED",
      supplierId: "supplier",
      rows: [
        { appliedItemId: "item", appliedUpdatedAt: "2026-10-15T00:00:00.000Z", previousItem: null },
      ],
    });
    mock.item.mockResolvedValue({
      id: "item",
      supplierId: "supplier",
      updatedAt: new Date("2026-10-16T00:00:00Z"),
    });
    await expect(rollbackSupplierList(form([]))).rejects.toThrow("modificados después");
    expect(mock.remove).not.toHaveBeenCalled();
    expect(mock.restore).not.toHaveBeenCalled();
    expect(mock.update).not.toHaveBeenCalled();
  });
});

it("saves the previous cost and applied timestamp with the approved list", async () => {
  mock.list.mockResolvedValue({
    status: "REVIEW",
    supplierId: "supplier",
    rows: [
      { code: "900", name: "Puerta", price: 125, unit: "UNIDAD", variantId: "v", reviewed: true },
    ],
  });
  mock.variants.mockResolvedValue([{ id: "v" }]);
  mock.previous.mockResolvedValue([
    {
      code: "900",
      name: "Puerta",
      listPrice: 100,
      unit: "UNIDAD",
      variantId: "v",
      purchased: true,
    },
  ]);
  mock.upsert.mockResolvedValue({ id: "item", updatedAt: new Date("2026-10-16T00:00:00Z") });
  await approveSupplierList("list");
  expect(mock.update).toHaveBeenCalledWith({
    where: { id: "list" },
    data: expect.objectContaining({
      status: "APPROVED",
      rows: [
        expect.objectContaining({
          previousItem: expect.objectContaining({ listPrice: 100 }),
          appliedItemId: "item",
          appliedUpdatedAt: "2026-10-16T00:00:00.000Z",
        }),
      ],
    }),
  });
});

it("does not offer an unsafe rollback for historical lists without a snapshot", async () => {
  mock.list.mockResolvedValue({
    status: "APPROVED",
    supplierId: "supplier",
    rows: [{ code: "900", name: "Puerta", price: 125 }],
  });
  await expect(rollbackSupplierList(form([]))).rejects.toThrow("no tiene respaldo");
  expect(mock.restore).not.toHaveBeenCalled();
  expect(mock.remove).not.toHaveBeenCalled();
});

it("rejects an approval when the reviewed draft has changed", async () => {
  await expect(approveSupplierList("list", "0".repeat(64))).rejects.toThrow(
    "cambió desde tu revisión",
  );
  expect(mock.upsert).not.toHaveBeenCalled();
  expect(mock.update).not.toHaveBeenCalled();
});
