import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ requireArea: vi.fn(), findMany: vi.fn() }));
vi.mock("@/server/rbac", () => ({ requireArea: mock.requireArea }));
vi.mock("@/server/db", () => ({ prisma: { supplierItem: { findMany: mock.findMany } } }));
import { loadSupplierItems } from "./items";

const row = (id: number) => ({
  id: String(id),
  name: "Alambre",
  code: `A${id}`,
  unit: "KG",
  purchased: true,
  updatedAt: new Date("2026-10-16T15:00:00Z"),
  listPrice: "125.50",
  variant: null,
});

beforeEach(() => {
  vi.resetAllMocks();
  mock.requireArea.mockResolvedValue({ userId: "admin" });
  mock.findMany.mockResolvedValue([]);
});

describe("supplier items incremental loading", () => {
  it("requires supplier authorization before reading any items", async () => {
    mock.requireArea.mockRejectedValue(new Error("Sin permiso"));
    await expect(loadSupplierItems({ supplierId: "s", query: "" })).rejects.toThrow("Sin permiso");
    expect(mock.requireArea).toHaveBeenCalledWith("suppliers");
    expect(mock.findMany).not.toHaveBeenCalled();
  });

  it("returns 20 serializable items and a cursor only when another item exists", async () => {
    mock.findMany.mockResolvedValue(Array.from({ length: 21 }, (_, i) => row(i + 1)));
    const batch = await loadSupplierItems({ supplierId: "s", query: "" });
    expect(batch.items).toHaveLength(20);
    expect(batch.next).toEqual({ name: "Alambre", id: "20" });
    expect(batch.items[0]).toMatchObject({ cost: 125.5, updatedAt: "16/10/2026" });
    expect(mock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 21, orderBy: [{ name: "asc" }, { id: "asc" }] }),
    );
  });

  it("keeps supplier and search restrictions when advancing across duplicate names", async () => {
    await loadSupplierItems({
      supplierId: "s",
      query: "galvanizado",
      after: { name: "Alambre", id: "20" },
    });
    expect(mock.findMany.mock.calls[0][0].where).toEqual({
      supplierId: "s",
      AND: [
        {
          OR: [
            { name: { contains: "galvanizado", mode: "insensitive" } },
            { code: { contains: "galvanizado", mode: "insensitive" } },
          ],
        },
        { OR: [{ name: { gt: "Alambre" } }, { name: "Alambre", id: { gt: "20" } }] },
      ],
    });
  });

  it("stops for an empty result or exactly one full final batch", async () => {
    expect((await loadSupplierItems({ supplierId: "s", query: "" })).next).toBeNull();
    mock.findMany.mockResolvedValue(Array.from({ length: 20 }, (_, i) => row(i + 1)));
    expect((await loadSupplierItems({ supplierId: "s", query: "" })).next).toBeNull();
  });
});
