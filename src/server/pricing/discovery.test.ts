import { expect, it, vi, beforeEach } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({ variant: vi.fn(), search: vi.fn(), create: vi.fn() }));
vi.mock("./token", () => ({ marketConnected: () => false, marketToken: async () => null }));
vi.mock("./search", async (original) => ({
  ...(await original<typeof import("./search")>()),
  searchRetail: mock.search,
}));
vi.mock("@/server/db", () => ({
  prisma: {
    productVariant: { findUniqueOrThrow: mock.variant },
    marketListing: { findUnique: async () => null, create: mock.create },
  },
}));
import { discoverMarket } from "./market";
beforeEach(() => {
  vi.clearAllMocks();
  mock.variant.mockResolvedValue({
    name: "Nombre del catálogo",
    attributes: {},
    salesUnit: "ROLLO",
    product: { name: "Genérico", brand: null, salesUnit: "ROLLO" },
    supplierItems: [
      {
        id: "s1",
        name: "CONCERTINA 300MM X (SIMPLE) 10M",
        code: "30S",
        unit: "ROLLO",
        purchased: true,
        supplier: { name: "Proveedor original" },
      },
    ],
  });
  mock.search.mockImplementation(async (_query, host) => {
    if (host === "megaben.com.ar") return ["https://megaben.com.ar/concertina-simple"];
    throw new Error("Fuente no disponible");
  });
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          '<script type="application/ld+json">{"@type":"Product","name":"Concertina simple 30cm x 10m","offers":{"@type":"Offer","price":37500,"priceCurrency":"ARS","availability":"https://schema.org/InStock"}}</script>',
          { headers: { "Content-Type": "text/html" } },
        ),
      ),
  );
});
it("searches the supplier literal name and persists unverified real-price candidates despite other source failures", async () => {
  const result = await discoverMarket("v1", "s1");
  expect(mock.search).toHaveBeenCalledWith("CONCERTINA 300MM X (SIMPLE) 10M", "megaben.com.ar");
  expect(result.found).toBe(1);
  expect(result.errors).toHaveLength(2);
  expect(result.context.supplier).toBe("Proveedor original");
  const data = mock.create.mock.calls[0][0].data;
  expect(data.price).toBe(37500);
  expect(data.verifiedAt).toBeUndefined();
});
it("rejects a supplier article that does not belong to the selected variant", async () => {
  await expect(discoverMarket("v1", "other-item")).rejects.toThrow("Elegí el artículo");
  expect(mock.search).not.toHaveBeenCalled();
  expect(mock.create).not.toHaveBeenCalled();
});
