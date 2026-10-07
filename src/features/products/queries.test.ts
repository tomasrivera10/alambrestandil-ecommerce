import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, findFirst } = vi.hoisted(() => ({ findMany: vi.fn(), findFirst: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: { product: { findMany, findFirst } },
  safeQuery: (run: () => Promise<unknown>) => run(),
}));
import { getProductBySlug, listProducts } from "./queries";

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

beforeEach(() => vi.clearAllMocks());
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
