import { describe, expect, it } from "vitest";
import { parseSupplierFile } from "./parse";
import { pdfFixture } from "./pdf-fixture";

const text = (x: number, y: number, value: string) => `BT /F1 14 Tf ${x} ${y} Td (${value}) Tj ET`;
const background = "1 1 1 rg 0 0 600 800 re f 0 0 0 rg";

describe("visible supplier PDF rows", () => {
  it("ignores hidden products and prices painted underneath the visible row", async () => {
    const pdf = pdfFixture(
      [
        background,
        text(130, 500, "PORTON 3 X 1.50 C/PINCHE"),
        text(460, 500, "$146.600"),
        "1 1 1 rg 100 480 480 45 re f 0 0 0 rg",
        text(130, 500, "PUERTA 0.90 X 2.00"),
        text(460, 500, "$78.546"),
        text(130, 420, "PUERTA"),
        text(215, 420, "0.90 X 1.00"),
        text(460, 420, "$60.102"),
      ].join("\n"),
      false,
      600,
      800,
      true,
    );
    const result = await parseSupplierFile("catalogo.pdf", pdf, "Metales Tratados");
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      name: "PUERTA 0.90 X 2.00",
      price: 78546,
      extraction: "verified",
      parserVersion: 2,
    });
    expect(result.rows[1]).toMatchObject({
      name: "PUERTA 0.90 X 1.00",
      price: 60102,
      extraction: "verified",
    });
    expect(result.rows.every((row) => row.sourceBounds && !row.name.includes("PORTON"))).toBe(true);
  }, 20_000);
  it("keeps two price columns tied to their visible presentation headings", async () => {
    const pdf = pdfFixture(
      [
        background,
        text(360, 560, "5/16"),
        text(490, 560, "3/8"),
        text(130, 500, "GANCHO J N 7"),
        text(360, 500, "$446"),
        text(490, 500, "$665"),
      ].join("\n"),
      false,
      600,
      800,
      true,
    );
    const result = await parseSupplierFile("catalogo.pdf", pdf, "Metales Tratados");
    expect(result.rows).toHaveLength(2);
    expect(result.rows.map((row) => [row.name.replace(/\s/g, ""), row.price])).toEqual([
      ["GANCHOJN7·5/16", 446],
      ["GANCHOJN7·3/8", 665],
    ]);
    expect(new Set(result.rows.map((row) => row.code)).size).toBe(2);
  }, 20_000);
  it("preserves dollar-denominated costs as USD requiring explicit conversion", async () => {
    const pdf = pdfFixture(
      [background, text(130, 500, "LISO CALIBRE 14"), text(460, 500, "USD 1.60")].join("\n"),
      false,
      600,
      800,
      true,
    );
    const result = await parseSupplierFile("catalogo.pdf", pdf, "Metales Tratados");
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ currency: "USD", price: 1.6, extraction: "ocr" });
    expect(result.rows[0].warning).toContain("USD");
  }, 20_000);
});
