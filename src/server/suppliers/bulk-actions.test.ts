import { beforeEach, describe, expect, it, vi } from "vitest";
import { supplierReviewRevision } from "./review-revision";
const mock = vi.hoisted(() => ({
  auth: vi.fn(),
  list: vi.fn(),
  update: vi.fn(),
  variants: vi.fn(),
  previous: vi.fn(),
  parse: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/rbac", () => ({ requireArea: mock.auth }));
vi.mock("./parse", () => ({ parseSupplierFile: mock.parse }));
vi.mock("@/server/db", () => ({
  prisma: {
    supplierPriceList: { findUniqueOrThrow: mock.list },
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        supplierPriceList: { findUniqueOrThrow: mock.list, update: mock.update },
        productVariant: { findMany: mock.variants },
        supplierItem: { findMany: mock.previous },
      }),
  },
}));
import { reprocessSupplierList, restoreSupplierRead, reviewSupplierRows } from "./bulk-actions";
const rows = [
  { code: "MT-one", name: "PUERTA 0.9 X1M", price: 100, page: 3 },
  { code: "MT-two", name: "PORTON 3 X 1.8", price: 200, page: 4 },
];
const edits = [
  {
    index: 0,
    name: rows[0].name,
    price: "100,00",
    unit: "UNIDAD",
    variantId: "door",
    currency: "ARS",
  },
  {
    index: 1,
    name: rows[1].name,
    price: "200,00",
    unit: "UNIDAD",
    variantId: "gate",
    currency: "ARS",
  },
];
const original = () => ({
  status: "REVIEW",
  supplierId: "supplier",
  filename: "catalogo.pdf",
  content: new Uint8Array([1]),
  supplier: { name: "Metales Tratados" },
  rows: structuredClone(rows),
  notes: "original",
});
const form = (changes: Record<string, string> = {}) => {
  const data = new FormData();
  Object.entries({
    listId: "list",
    revision: supplierReviewRevision(rows),
    mode: "include",
    edits: JSON.stringify(edits),
    confirmed: "on",
    ...changes,
  }).forEach(([key, value]) => data.set(key, value));
  return data;
};
beforeEach(() => {
  vi.clearAllMocks();
  mock.auth.mockResolvedValue({ userId: "admin" });
  mock.list.mockResolvedValue(original());
  mock.previous.mockResolvedValue([]);
  mock.variants.mockResolvedValue([
    {
      id: "door",
      name: "PUERTA 0.90 X1M",
      salesUnit: "UNIDAD",
      sourceReference: "Alambres Tandil.xlsx · Stock!A1",
      product: { salesUnit: "UNIDAD" },
    },
    {
      id: "gate",
      name: "PORTON 1.8 X3M",
      salesUnit: "UNIDAD",
      sourceReference: "Alambres Tandil.xlsx · Stock!A2",
      product: { salesUnit: "UNIDAD" },
    },
  ]);
});
describe("supplier bulk review", () => {
  it("confirms multiple explicit proposals in a single draft update", async () => {
    await reviewSupplierRows(form());
    expect(mock.update).toHaveBeenCalledTimes(1);
    expect(mock.update.mock.calls[0][0].data.rows).toEqual([
      expect.objectContaining({
        variantId: "door",
        reviewed: true,
        price: 100,
        sourcePrice: 100,
        sourceName: rows[0].name,
      }),
      expect.objectContaining({ variantId: "gate", reviewed: true, price: 200 }),
    ]);
  });
  it("rejects stale submissions before changing any rows", async () => {
    await expect(reviewSupplierRows(form({ revision: "0".repeat(64) }))).rejects.toThrow(
      "otra pestaña",
    );
    expect(mock.update).not.toHaveBeenCalled();
  });
  it.each([reprocessSupplierList, restoreSupplierRead, reviewSupplierRows])(
    "requires server authorization before reading data",
    async (action) => {
      mock.auth.mockRejectedValueOnce(new Error("No autorizado"));
      await expect(action(form())).rejects.toThrow("No autorizado");
      expect(mock.list).not.toHaveBeenCalled();
    },
  );
  it.each([
    { currency: "USD" },
    { price: "0" },
    { price: "-1" },
    { variantId: "inactive" },
    { unit: "ROLLO" },
    { name: "" },
  ])("rejects an invalid row without saving the other selected row: %o", async (change) => {
    await expect(
      reviewSupplierRows(form({ edits: JSON.stringify([edits[0], { ...edits[1], ...change }]) })),
    ).rejects.toThrow();
    expect(mock.update).not.toHaveBeenCalled();
  });
  it("rejects two selected products linked to one variant", async () => {
    await expect(
      reviewSupplierRows(
        form({ edits: JSON.stringify([edits[0], { ...edits[1], variantId: "door" }]) }),
      ),
    ).rejects.toThrow("misma medida");
    expect(mock.update).not.toHaveBeenCalled();
  });
  it("omits multiple rows without accepting incomplete costs or writing local edits", async () => {
    await reviewSupplierRows(
      form({
        mode: "exclude",
        edits: JSON.stringify(
          edits.map((edit) => ({ ...edit, name: "", price: "", variantId: "" })),
        ),
      }),
    );
    expect(mock.update.mock.calls[0][0].data.rows).toEqual(
      rows.map((row) => ({ ...row, excluded: true })),
    );
  });
  it("requires explicit batch confirmation", async () => {
    await expect(reviewSupplierRows(form({ confirmed: "" }))).rejects.toThrow("Confirmá");
    expect(mock.update).not.toHaveBeenCalled();
  });
});
describe("supplier source rereading", () => {
  it("saves a reversible backup without approving costs", async () => {
    mock.parse.mockResolvedValue({
      rows: [{ ...rows[0], parserVersion: 2 }],
      notes: "new reading",
    });
    await reprocessSupplierList(form());
    const data = mock.update.mock.calls[0][0].data;
    expect(JSON.parse(data.rows[0].readBackup.rowsJson)).toEqual(rows);
    expect(data.rows[0].readBackup.notes).toBe("original");
    expect(data.status).toBeUndefined();
  });
  it("preserves all current decisions if the list changed during extraction", async () => {
    mock.parse.mockResolvedValue({ rows, notes: "new reading" });
    mock.list
      .mockResolvedValueOnce(original())
      .mockResolvedValueOnce({ ...original(), rows: [{ ...rows[0], excluded: true }] });
    await expect(reprocessSupplierList(form())).rejects.toThrow("otra pestaña");
    expect(mock.update).not.toHaveBeenCalled();
  });
  it("does not replace the list after an empty or failed reading", async () => {
    mock.parse.mockResolvedValue({ rows: [], notes: "empty" });
    await expect(reprocessSupplierList(form())).rejects.toThrow("conservó");
    expect(mock.update).not.toHaveBeenCalled();
  });
});

it("does not block a valid selected product because unrelated unlinked rows have duplicated codes", async () => {
  const list = original();
  list.rows.push(
    { code: "duplicate", name: "Otro proveedor", price: 5, page: 5 },
    { code: "duplicate", name: "Otro proveedor", price: 6, page: 6 },
  );
  mock.list.mockResolvedValue(list);
  await reviewSupplierRows(
    form({ revision: supplierReviewRevision(list.rows), edits: JSON.stringify([edits[0]]) }),
  );
  expect(mock.update).toHaveBeenCalledTimes(1);
  expect(mock.update.mock.calls[0][0].data.rows[0].reviewed).toBe(true);
});
