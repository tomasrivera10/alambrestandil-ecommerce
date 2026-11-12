import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { literalSearch, searchLinks } from "./search";
it("preserves the supplier's literal product name without treating the supplier as a brand", () => {
  expect(
    literalSearch({
      name: "CONCERTINA 300MM X (SIMPLE) 10M",
      code: "C30",
      unit: "ROLLO",
      supplier: { name: "Distribuidor SA" },
    }),
  ).toEqual({
    query: "CONCERTINA 300MM X (SIMPLE) 10M",
    supplier: "Distribuidor SA",
    code: "C30",
    unit: "ROLLO",
  });
});
it("only accepts exact source product URLs and decodes XML safely", () => {
  expect(
    searchLinks(
      "<rss><item><link>https://megaben.com.ar/producto?a=1&amp;b=2</link></item><item><link>https://megaben.com.ar.evil.test/producto</link></item><item><link>http://megaben.com.ar/producto</link></item><item><link>https://user:pass@megaben.com.ar/producto</link></item></rss>",
      "megaben.com.ar",
    ),
  ).toEqual(["https://megaben.com.ar/producto?a=1&b=2"]);
});

import { catalogueCandidates } from "./search";
it("finds supplier-named candidates in the retailer catalogue without accepting a different presentation", () => {
  const xml =
    "<urlset><url><loc>https://megaben.com.ar/alambre-de-concertina-simple-de-30cm-x-10m</loc></url><url><loc>https://megaben.com.ar/alambre-de-concertina-doble-cruzado-de-30cm-x-10m</loc></url><url><loc>https://evil.test/concertina-simple</loc></url></urlset>";
  expect(catalogueCandidates(xml, "CONCERTINA 300MM X (SIMPLE) 10M")).toEqual([
    "https://megaben.com.ar/alambre-de-concertina-simple-de-30cm-x-10m",
  ]);
});
