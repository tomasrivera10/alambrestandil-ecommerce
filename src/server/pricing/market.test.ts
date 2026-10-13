import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/server/db", () => ({ prisma: {} }));
import { validateMarketUrl, fetchMarketListing } from "./market";
beforeEach(() => {
  vi.unstubAllGlobals();
  process.env.MARKET_ALLOWED_HOSTS = "tienda-ejemplo.com";
  delete process.env.MERCADOLIBRE_ACCESS_TOKEN;
});
describe("market sources", () => {
  it("only permits exact HTTPS hosts without credentials or alternate ports", () => {
    expect(validateMarketUrl("https://articulo.mercadolibre.com.ar/MLA-123-producto").ml).toBe(
      true,
    );
    expect(() => validateMarketUrl("http://tienda-ejemplo.com/item")).toThrow();
    expect(() => validateMarketUrl("https://tienda-ejemplo.com.evil.test/item")).toThrow();
    expect(() => validateMarketUrl("https://user:password@tienda-ejemplo.com/item")).toThrow();
  });
  it("uses one in-stock ARS offer and refuses price ranges", async () => {
    const page = (offers: unknown) =>
      new Response(
        `<script type="application/ld+json">${JSON.stringify({ "@type": "Product", name: "Gancho galvanizado", sku: "G1", offers })}</script>`,
        { headers: { "Content-Type": "text/html" } },
      );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        page({
          "@type": "Offer",
          price: "25.50",
          priceCurrency: "ARS",
          availability: "https://schema.org/InStock",
        }),
      ),
    );
    expect((await fetchMarketListing("https://tienda-ejemplo.com/gancho")).price).toBe(25.5);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        page({
          "@type": "AggregateOffer",
          lowPrice: "25.50",
          priceCurrency: "ARS",
          availability: "https://schema.org/InStock",
        }),
      ),
    );
    await expect(fetchMarketListing("https://tienda-ejemplo.com/gancho")).rejects.toThrow(
      "precio único",
    );
  });
  it("refuses ambiguous marketplace variations", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          status: "active",
          condition: "new",
          currency_id: "ARS",
          title: "Tejido",
          seller_id: 1,
          variations: [{ id: 1 }, { id: 2 }],
        }),
      ),
    );
    await expect(
      fetchMarketListing("https://articulo.mercadolibre.com.ar/MLA-123-test"),
    ).rejects.toThrow("varias medidas");
  });
  it("surfaces unavailable sources rather than inventing a price", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 403 })));
    await expect(
      fetchMarketListing("https://articulo.mercadolibre.com.ar/MLA-123-test"),
    ).rejects.toThrow("403");
  });
});
