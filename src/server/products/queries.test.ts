import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, findFirst, entries } = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  entries: new Map<string, unknown>(),
}));
vi.mock("next/cache", () => ({
  unstable_cache:
    (read: (...args: unknown[]) => Promise<unknown>, keys: string[]) =>
    async (...args: unknown[]) => {
      const key = JSON.stringify([keys, args]);
      if (entries.has(key)) return entries.get(key);
      const result = await read(...args);
      entries.set(key, result);
      return result;
    },
  updateTag: vi.fn(() => entries.clear()),
}));
vi.mock("@/server/db", () => ({
  prisma: { product: { findMany, findFirst } },
  safeQuery: (run: () => Promise<unknown>) => run(),
}));
import { getProductBySlug, listProducts } from "./queries";
import { invalidateCatalog } from "./cache";

const product = {
  id: "p1",
  name: "Tejido",
  slug: "tejido",
  shortDescription: "Tejido",
  priceVisibility: "HIDDEN",
  price: { toNumber: () => 98765 },
  category: { slug: "mallas", name: "Mallas" },
  images: [],
  complements: [],
  variants: [{ id: "v1", price: { toNumber: () => 87654 }, inventory: null }],
};

beforeEach(() => {
  vi.clearAllMocks();
  entries.clear();
});
describe("public price privacy", () => {
  it("does not expose hidden prices in catalog results", async () => {
    findMany.mockResolvedValue([product]);
    const results = await listProducts();
    expect(results[0].price).toBeNull();
    expect(JSON.stringify(results)).not.toContain("98765");
  });
  it("removes hidden product and variant prices before client serialization", async () => {
    findFirst.mockResolvedValue(product);
    const result = await getProductBySlug("mallas", "tejido");
    expect(result?.price).toBeNull();
    expect(result?.variants[0].price).toBeNull();
    expect(JSON.stringify(result)).not.toMatch(/98765|87654/);
  });
  it("keeps explicitly public prices available", async () => {
    findFirst.mockResolvedValue({ ...product, priceVisibility: "PUBLIC" });
    expect((await getProductBySlug("mallas", "tejido"))?.price).toBe(98765);
  });
});

describe("catalog caching", () => {
  it("fetches fresh products after a catalog invalidation", async () => {
    findMany.mockResolvedValueOnce([product]).mockResolvedValueOnce([]);
    expect(await listProducts()).toHaveLength(1);
    invalidateCatalog();
    expect(await listProducts()).toEqual([]);
    expect(findMany).toHaveBeenCalledTimes(2);
  });
  it("reuses successful reads for the same filters", async () => {
    findMany.mockResolvedValue([product]);
    await listProducts({ featured: true });
    await listProducts({ featured: true });
    expect(findMany).toHaveBeenCalledTimes(1);
  });
  it("separates different filters", async () => {
    findMany.mockResolvedValue([product]);
    await listProducts({ featured: true });
    await listProducts({ categorySlug: "mallas" });
    expect(findMany).toHaveBeenCalledTimes(2);
  });
  it("does not cache an outage as an empty catalog", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    findMany.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce([product]);
    expect(await listProducts()).toEqual([]);
    expect(await listProducts()).toHaveLength(1);
    expect(findMany).toHaveBeenCalledTimes(2);
    log.mockRestore();
  });
});
