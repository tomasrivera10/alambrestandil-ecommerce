import { expect, it, vi } from "vitest";
import ExcelJS from "exceljs";
import JSZip from "jszip";
vi.mock("server-only", () => ({}));
import { originalDocumentPreview } from "./preview";
it("keeps spreadsheet row numbers and original cell values", async () => {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Lista original");
  sheet.getCell("B14").value = "99901";
  sheet.getCell("C14").value = "GANCHO J";
  sheet.getCell("M14").value = 20.5;
  const result = await originalDocumentPreview(
    "lista.xlsx",
    Buffer.from(await book.xlsx.writeBuffer()),
  );
  expect(result.kind).toBe("spreadsheet");
  if (result.kind !== "spreadsheet") return;
  expect(result.sheet).toBe("Lista original");
  expect(result.columns[12]).toBe("M");
  expect(result.rows[0]).toMatchObject({ number: 14 });
  expect(result.rows[0].cells[12]).toBe("20.5");
});
it("extracts actual Word text without claiming original page layout", async () => {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  );
  zip.file(
    "_rels/.rels",
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  );
  zip.file(
    "word/document.xml",
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>GANCHO J $ 20,50</w:t></w:r></w:p></w:body></w:document>',
  );
  const result = await originalDocumentPreview(
    "lista.docx",
    await zip.generateAsync({ type: "nodebuffer" }),
  );
  expect(result).toMatchObject({
    kind: "text",
    text: expect.stringContaining("GANCHO J $ 20,50"),
    truncated: false,
  });
});
