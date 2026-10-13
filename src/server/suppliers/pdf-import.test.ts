import { describe, expect, it } from "vitest";
import { createCanvas } from "@napi-rs/canvas";
import { parseSupplierFile } from "./parse";
import { pdfFixture } from "./pdf-fixture";
describe("PDF price extraction", () => {
  it("extracts a literal decimal cost, page and review warning from a digital PDF", async () => {
    const result = await parseSupplierFile(
      "lista.pdf",
      pdfFixture("GANCHO GALVANIZADO $ 20,50"),
      "Proveedor de prueba",
    );
    expect(result.rows[0]).toMatchObject({
      name: "GANCHO GALVANIZADO",
      price: 20.5,
      page: 1,
      extraction: "text",
    });
    expect(result.rows[0].warning).toBeTruthy();
  });
  it("runs OCR for scanned PDFs and keeps the original page for verification", async () => {
    const canvas = createCanvas(1000, 220);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 1000, 220);
    ctx.fillStyle = "black";
    ctx.font = "48px Arial";
    ctx.fillText("GANCHO GALVANIZADO $ 20,50", 30, 120);
    const result = await parseSupplierFile(
      "escaneada.pdf",
      pdfFixture(canvas.toBuffer("image/jpeg"), true),
      "Proveedor de prueba",
    );
    expect(result.rows[0]).toMatchObject({ price: 20.5, page: 1, extraction: "ocr" });
    expect(result.rows[0].warning).toContain("OCR");
  }, 20000);
});
