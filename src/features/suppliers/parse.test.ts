import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { parseSupplierFile } from "./parse";

describe("supplier spreadsheet import", () => {
  it("keeps provider codes and marks missing prices for review", async () => {
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet("Lista");
    sheet.getCell("B14").value = 20104;
    sheet.getCell("C14").value = "NEGRO RECOCIDO Nº 14";
    sheet.getCell("M14").value = "$ 3,149.35";
    sheet.getCell("B15").value = 20105;
    sheet.getCell("C15").value = "NEGRO RECOCIDO Nº 16";
    sheet.getCell("J15").value = { formula: "#REF!", result: "#REF!" };
    const bytes = Buffer.from(await book.xlsx.writeBuffer());

    const result = await parseSupplierFile("lista.xlsx", bytes, "Romboidal");

    expect(result.rows).toEqual([
      { code: "20104", name: "NEGRO RECOCIDO Nº 14", price: 3149.35, page: 14, warning: undefined },
      { code: "20105", name: "NEGRO RECOCIDO Nº 16", price: null, page: 15, warning: "Precio faltante o inválido" },
    ]);
  });
});
