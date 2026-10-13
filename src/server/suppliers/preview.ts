import "server-only";
import ExcelJS from "exceljs";
import mammoth from "mammoth";
export type DocumentPreview =
  | {
      kind: "spreadsheet";
      sheet: string;
      columns: string[];
      rows: { number: number; cells: string[] }[];
      truncated: boolean;
    }
  | { kind: "text"; text: string; truncated: boolean };
export async function originalDocumentPreview(
  filename: string,
  bytes: Buffer,
): Promise<DocumentPreview> {
  if (filename.toLowerCase().endsWith(".xlsx")) {
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(bytes as never);
    const sheet = book.worksheets[0];
    if (!sheet) throw new Error("El archivo no contiene hojas.");
    const columns = Math.min(sheet.columnCount, 40),
      rows: { number: number; cells: string[] }[] = [];
    sheet.eachRow((row) => {
      if (rows.length >= 1000) return;
      rows.push({
        number: row.number,
        cells: Array.from({ length: columns }, (_, index) => row.getCell(index + 1).text),
      });
    });
    return {
      kind: "spreadsheet",
      sheet: sheet.name,
      columns: Array.from({ length: columns }, (_, index) => {
        let n = index + 1,
          label = "";
        while (n > 0) {
          n--;
          label = String.fromCharCode(65 + (n % 26)) + label;
          n = Math.floor(n / 26);
        }
        return label;
      }),
      rows,
      truncated: sheet.actualRowCount > 1000 || sheet.columnCount > 40,
    };
  }
  if (filename.toLowerCase().endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer: bytes });
    return { kind: "text", text: value.slice(0, 200000), truncated: value.length > 200000 };
  }
  throw new Error("Abrí el PDF en la vista del documento original.");
}
