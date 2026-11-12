import ExcelJS from "exceljs";
import mammoth from "mammoth";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import type { Worker } from "tesseract.js";
import { extractDesignedPage } from "./designed-pdf";

export type ImportedRow = {
  code: string;
  name: string;
  price: number | null;
  unit?: string;
  page?: number;
  documentY?: number;
  sourceBounds?: { x: number; y: number; width: number; height: number };
  parserVersion?: number;
  currency?: "ARS" | "USD";
  sourceName?: string;
  sourcePrice?: number | null;
  sourceCurrency?: "ARS" | "USD";
  readBackup?: { rowsJson: string; notes: string | null; createdAt: string };
  warning?: string;
  variantId?: string;
  excluded?: boolean;
  reviewed?: boolean;
  appliedItemId?: string;
  appliedUpdatedAt?: string;
  previousItem?: {
    name: string;
    unit: string | null;
    listPrice: number | null;
    variantId: string | null;
    purchased: boolean;
  } | null;
  extraction?: "text" | "ocr" | "verified";
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
        warning:
          price == null ? "Precio faltante o inválido" : "Verificar costo, unidad y presentación",
      });
    });
    return {
      rows,
      notes: "Columna M de la primera hoja. Verificá IVA y descuentos antes de aprobar.",
    };
  }
  let pages: string[];
  const positionedRows: ImportedRow[] = [];
  const ocrPages = new Set<number>();
  const isMetales = /metales tratados/i.test(supplierName);
  if (ext === "pdf") {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const task = pdfjs.getDocument({
      data: new Uint8Array(bytes),
      useSystemFonts: true,
      disableFontFace: true,
    });
    const doc = await task.promise;
    if (doc.numPages > 60) {
      await task.destroy();
      throw new Error("La lista supera las 60 páginas. Dividila en archivos más pequeños.");
    }
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
          await ocrWorker.setParameters({ tessedit_pageseg_mode: "3" as never });
          const result = await ocrWorker.recognize(canvas.toBuffer("image/png"));
          ocrPages.add(n);
          pages.push(result.data.text);
          continue;
        }
        const lines = new Map<number, { x: number; text: string }[]>();
        for (const item of fragments) {
          const y = Math.round(item.transform[5] / 3) * 3;
          lines.set(y, [...(lines.get(y) ?? []), { x: item.transform[4], text: item.str }]);
        }
        if (isMetales && fragments.some((item) => /\$|\bU\s*S\s*D\b/.test(item.str))) {
          const { createWorker } = await import("tesseract.js");
          const require = createRequire(import.meta.url);
          const language = require("@tesseract.js-data/spa") as { langPath: string };
          ocrWorker ??= await createWorker("spa", undefined, {
            langPath: language.langPath,
            cacheMethod: "none",
          });
          positionedRows.push(...(await extractDesignedPage(page, ocrWorker, n)));
          pages.push("");
          continue;
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
      await task.destroy();
    }
  } else if (ext === "docx") {
    pages = [(await mammoth.extractRawText({ buffer: bytes })).value];
  } else {
    throw new Error("Formato no admitido. Subí PDF, XLSX o DOCX.");
  }
  const rows: ImportedRow[] = [...positionedRows];
  const isTemperley = /temperley/i.test(supplierName);
  pages.forEach((page, index) => {
    page.split(/\n/).forEach((line) => {
      const priceMatch = line.match(/\$\s*([\d.,]+)/);
      if (!priceMatch) return;
      const price = money(priceMatch[1]);
      const before = line.slice(0, priceMatch.index).trim();
      if (before.length < 4 || !price) return;
      const coded = isTemperley ? before.match(/^(\d+(?:\.\d+)?)\s+(.+)$/) : null;
      const code =
        coded?.[1] ??
        `AUTO-${createHash("sha256").update(before.trim().toUpperCase()).digest("hex").slice(0, 12)}`;
      const name = coded?.[2] ?? before;
      rows.push({
        code,
        name,
        price,
        extraction: ocrPages.has(index + 1) ? "ocr" : "text",
        page: index + 1,
        warning: ocrPages.has(index + 1)
          ? "Verificar lectura OCR y unidad"
          : isTemperley
            ? "Verificar costo, unidad y presentación"
            : "Verificar lectura visual y unidad",
      });
    });
  });
  if (rows.length === 0)
    throw new Error(
      "No se detectaron precios. Este documento puede requerir OCR local o carga manual.",
    );
  return {
    rows,
    notes: isMetales
      ? "Lectura de las filas visibles, contrastada con el texto del PDF. Las discrepancias requieren confirmación. Importes literales, sin IVA ni descuentos inferidos."
      : isTemperley
        ? "Verificá IVA y descuentos en el documento. Guardamos cada costo literalmente."
        : "Revisá cada fila: los catálogos diseñados pueden superponer texto.",
  };
}
