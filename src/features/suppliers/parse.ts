import ExcelJS from "exceljs";
import mammoth from "mammoth";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import type { Worker } from "tesseract.js";

export type ImportedRow = {
  code: string;
  name: string;
  price: number | null;
  unit?: string;
  page?: number;
  warning?: string;
};

function money(value: unknown): number | null {
  if (typeof value === "number")
    return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
  if (typeof value !== "string") return null;
  const match = value.match(/[\d.,]+/g)?.at(-1);
  if (!match) return null;
  const clean =
    match.includes(",") && match.includes(".")
      ? match.lastIndexOf(",") > match.lastIndexOf(".")
        ? match.replace(/\./g, "").replace(",", ".")
        : match.replace(/,/g, "")
      : match.includes(",")
        ? match.replace(",", ".")
        : /^\d{1,3}(\.\d{3})+$/.test(match)
          ? match.replace(/\./g, "")
          : match;
  const parsed = Number(clean);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : null;
}

export async function parseSupplierFile(
  filename: string,
  bytes: Buffer,
  supplierName: string,
): Promise<{ rows: ImportedRow[]; notes: string }> {
  const ext = filename.toLowerCase().split(".").at(-1);
  if (ext === "xlsx") {
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(bytes as never);
    const sheet = book.worksheets[0];
    if (!sheet) throw new Error("El Excel no contiene hojas.");
    const rows: ImportedRow[] = [];
    sheet.eachRow((row) => {
      const code = String(row.getCell(2).value ?? "").trim();
      const name = String(row.getCell(3).value ?? "").trim();
      if (!/^\d{3,}$/.test(code) || !name) return;
      const cell = row.getCell(13);
      const price = money(cell.result ?? cell.value);
      rows.push({
        code,
        name,
        price,
        page: row.number,
        warning: price == null ? "Precio faltante o inválido" : undefined,
      });
    });
    return {
      rows,
      notes: "Columna M de la primera hoja. Verificá IVA y descuentos antes de aprobar.",
    };
  }
  let pages: string[];
  const positionedRows: ImportedRow[] = [];
  const isMetales = /metales tratados/i.test(supplierName);
  if (ext === "pdf") {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(bytes),
      useSystemFonts: true,
      disableFontFace: true,
    }).promise;
    pages = [];
    let ocrWorker: Worker | undefined;
    try {
      for (let n = 1; n <= doc.numPages; n++) {
        const page = await doc.getPage(n);
        const content = await page.getTextContent();
        const fragments = content.items.filter(
          (item): item is Extract<typeof item, { str: string }> => "str" in item,
        );
        if (
          fragments
            .map((item) => item.str)
            .join("")
            .trim().length < 20
        ) {
          const { createCanvas } = await import("@napi-rs/canvas");
          const { createWorker } = await import("tesseract.js");
          const require = createRequire(import.meta.url);
          const language = require("@tesseract.js-data/spa") as { langPath: string };
          ocrWorker ??= await createWorker("spa", undefined, {
            langPath: language.langPath,
            cacheMethod: "none",
          });
          const viewport = page.getViewport({ scale: 2 });
          const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
          await page.render({
            canvasContext: canvas.getContext("2d") as never,
            canvas: canvas as never,
            viewport,
          }).promise;
          const result = await ocrWorker.recognize(canvas.toBuffer("image/png"));
          pages.push(result.data.text);
          continue;
        }
        const lines = new Map<number, { x: number; text: string }[]>();
        for (const item of fragments) {
          const y = Math.round(item.transform[5] / 3) * 3;
          lines.set(y, [...(lines.get(y) ?? []), { x: item.transform[4], text: item.str }]);
        }
        if (isMetales) {
          [...lines.entries()]
            .sort((a, b) => b[0] - a[0])
            .forEach(([, parts]) => {
              const priceText = parts
                .filter((part) => part.x > 380 && part.text.includes("$"))
                .map((part) => part.text.replace(/\s+/g, ""))
                .at(0);
              const nameText = parts
                .filter((part) => part.x < 205 && !part.text.includes("$"))
                .sort((a, b) => a.x - b.x)
                .map((part) => part.text)
                .join(" ")
                .trim();
              const price = priceText ? money(priceText) : null;
              if (!nameText || price == null) return;
              const name = nameText.replace(/\s*\.\s*/g, ".").replace(/\s+/g, " ");
              positionedRows.push({
                code: `MT-${createHash("sha256").update(name.toUpperCase()).digest("hex").slice(0, 12)}`,
                name,
                price,
                page: n,
                warning: "Verificar lectura visual y unidad",
              });
            });
        }
        pages.push(
          [...lines.entries()]
            .sort((a, b) => b[0] - a[0])
            .map(([, parts]) =>
              parts
                .sort((a, b) => a.x - b.x)
                .map((p) => p.text)
                .join(" "),
            )
            .join("\n"),
        );
      }
    } finally {
      await ocrWorker?.terminate();
    }
  } else if (ext === "docx") {
    pages = [(await mammoth.extractRawText({ buffer: bytes })).value];
  } else {
    throw new Error("Formato no admitido. Subí PDF, XLSX o DOCX.");
  }
  const rows: ImportedRow[] = [];
  if (isMetales && positionedRows.length)
    return {
      rows: positionedRows,
      notes:
        "Catálogo diagramado: verificá cada precio, descripción y unidad contra la página antes de aprobar.",
    };
  const isTemperley = /temperley/i.test(supplierName);
  pages.forEach((page, index) => {
    page.split(/\n/).forEach((line, lineIndex) => {
      const priceMatch = line.match(/\$\s*([\d.,]+)/);
      if (!priceMatch) return;
      const price = money(priceMatch[1]);
      const before = line.slice(0, priceMatch.index).trim();
      if (before.length < 4 || !price) return;
      const coded = isTemperley ? before.match(/^(\d+(?:\.\d+)?)\s+(.+)$/) : null;
      const code = coded?.[1] ?? `p${index + 1}-l${lineIndex + 1}`;
      const name = coded?.[2] ?? before;
      rows.push({
        code,
        name,
        price,
        page: index + 1,
        warning: isTemperley ? undefined : "Verificar lectura visual y unidad",
      });
    });
  });
  if (rows.length === 0)
    throw new Error(
      "No se detectaron precios. Este documento puede requerir OCR local o carga manual.",
    );
  return {
    rows,
    notes: isTemperley
      ? "Precios con IVA incluido; descuento por pago temprano separado."
      : "Revisá cada fila: los catálogos diseñados pueden superponer texto.",
  };
}
