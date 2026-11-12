import { createHash } from "node:crypto";
import type { PDFPageProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { Worker } from "tesseract.js";
import type { ImportedRow } from "./parse";

export const DESIGNED_PDF_VERSION = 2;
export type PdfFragment = { str: string; transform: number[]; width: number; height: number };
type Word = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
};

// Compare independent readings without treating O as zero or changing dimensions.
function compact(text: string) {
  return text
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/¾/g, "3/4")
    .replace(/½/g, "1/2")
    .replace(/[,]/g, ".")
    .replace(/[º°*]/g, "")
    .replace(/\s/g, "");
}

function readMoney(text: string): number | null {
  const valueText = text.replace(/\s/g, "");
  const clean = valueText.replace(/^(?:USD|US\$|\$)/i, "");
  if (/^USD/i.test(valueText) && /^\d+\.\d{1,2}$/.test(clean)) return Number(clean);
  if (!/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(clean)) return null;
  const value = Number(clean.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(value) && value > 0 && value <= 9_999_999_999.99 ? value : null;
}

function wordsFromTsv(tsv: string): Word[] {
  return tsv
    .split("\n")
    .slice(1)
    .flatMap((line) => {
      const fields = line.split("\t");
      if (fields[0] !== "5" || !fields[11]?.trim()) return [];
      return [
        {
          text: fields.slice(11).join("\t").trim(),
          x: Number(fields[6]),
          y: Number(fields[7]),
          width: Number(fields[8]),
          height: Number(fields[9]),
          confidence: Number(fields[10]),
        },
      ];
    });
}

function digitalNameAgrees(name: string, parts: PdfFragment[], priceX: number, baseline: number) {
  const candidates = parts.filter(
    (part) =>
      Math.abs(part.transform[5] - baseline) < 8 &&
      part.transform[4] < priceX - 12 &&
      !/\$|U\s*S\s*D/.test(part.str) &&
      part.str.trim(),
  );
  const target = compact(name);
  const visit = (value: string, end: number, depth: number): boolean => {
    if (compact(value) === target) return true;
    if (depth >= 4 || compact(value).length >= target.length) return false;
    return candidates.some(
      (part) =>
        part.transform[4] >= end - 1 &&
        visit(value + part.str, part.transform[4] + part.width, depth + 1),
    );
  };
  return candidates.some((part) => visit(part.str, part.transform[4] + part.width, 1));
}

/** Read the rendered source strips. Hidden PDF layers cannot become imported products. */
export async function extractDesignedPage(
  page: PDFPageProxy,
  worker: Worker,
  pageNumber: number,
): Promise<ImportedRow[]> {
  const content = await page.getTextContent();
  const fragments = content.items.filter(
    (item): item is PdfFragment & typeof item => "str" in item && !!item.str.trim(),
  );
  const prices = fragments.filter((part) => /\$|\bU\s*S\s*D\b/.test(part.str));
  if (!prices.length) return [];
  const baselines: number[] = [];
  for (const part of [...prices].sort((a, b) => b.transform[5] - a.transform[5])) {
    if (!baselines.some((y) => Math.abs(y - part.transform[5]) < 8))
      baselines.push(part.transform[5]);
  }
  const { createCanvas } = await import("@napi-rs/canvas");
  const scale = 3;
  const viewport = page.getViewport({ scale });
  if (viewport.width * viewport.height > 20_000_000)
    throw new Error(`La página ${pageNumber} excede el tamaño de lectura admitido.`);
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  await page.render({
    canvasContext: canvas.getContext("2d") as never,
    canvas: canvas as never,
    viewport,
  }).promise;
  // The left edge comes from actual description fragments, excluding page art.
  const left = Math.max(
    0,
    Math.min(
      ...fragments
        .filter(
          (part) =>
            baselines.some((y) => Math.abs(y - part.transform[5]) < 8) &&
            part.transform[4] < Math.min(...prices.map((p) => p.transform[4])) - 20,
        )
        .map((part) => part.transform[4]),
      page.view[2] * 0.2,
    ) - 12,
  );
  const originX = Math.floor(left * scale);
  await worker.setParameters({ tessedit_pageseg_mode: "7" as never });
  const readStrip = async (baseline: number, header?: PdfFragment) => {
    const [, screenY] = viewport.convertToViewportPoint(0, baseline);
    const top = Math.max(0, Math.floor(screenY - (header ? 18 : 25) * scale));
    const height = Math.min((header ? 24 : 38) * scale, canvas.height - top);
    const cropLeft = header ? Math.max(0, Math.floor((header.transform[4] - 8) * scale)) : originX;
    const crop = createCanvas(
      header
        ? Math.min(canvas.width - cropLeft, Math.ceil((header.width + 18) * scale))
        : canvas.width - originX,
      height,
    );
    crop
      .getContext("2d")
      .drawImage(canvas, cropLeft, top, crop.width, height, 0, 0, crop.width, height);
    const result = await worker.recognize(
      crop.toBuffer("image/png"),
      {},
      { tsv: true, text: true },
    );
    return {
      words: wordsFromTsv(result.data.tsv ?? ""),
      text: result.data.text,
      bounds: {
        x: originX / viewport.width,
        y: top / viewport.height,
        width: crop.width / viewport.width,
        height: height / viewport.height,
      },
    };
  };
  const strips = [];
  for (const baseline of baselines) strips.push({ baseline, ...(await readStrip(baseline)) });
  const headerParts = fragments.filter(
    (part) =>
      /^\d+\/\d+$/.test(compact(part.str)) &&
      part.transform[5] > baselines[0] + 10 &&
      part.transform[5] < baselines[0] + 110,
  );
  const headers: { text: string; x: number }[] = [];
  for (const part of headerParts) {
    const visible = await readStrip(part.transform[5], part);
    if (compact(visible.text).includes(compact(part.str)))
      headers.push({ text: compact(part.str), x: part.transform[4] });
  }
  let section: string | undefined;
  let sectionVerified = true;
  if (fragments.some((part) => compact(part.str) === "PLANCHUELAS")) {
    const dimensions = fragments.filter(
      (part) =>
        part.transform[5] > baselines[0] + 15 &&
        part.transform[5] < baselines[0] + 120 &&
        part.transform[4] > page.view[2] * 0.6 &&
        /^[\d./X"¨]+$/.test(compact(part.str)),
    );
    for (const part of dimensions) {
      const visible = await readStrip(part.transform[5], part);
      section = compact(part.str);
      sectionVerified = compact(visible.text).includes(section);
    }
  }
  const rows: ImportedRow[] = [];
  for (const strip of strips) {
    const tokens = strip.words.sort((a, b) => a.x - b.x);
    const nearbyPrices = prices
      .filter((part) => Math.abs(part.transform[5] - strip.baseline) < 8)
      .sort((a, b) => a.transform[4] - b.transform[4]);
    const columns: PdfFragment[][] = [];
    for (const part of nearbyPrices) {
      const last = columns.at(-1);
      if (last && part.transform[4] - last[0].transform[4] < 65) last.push(part);
      else columns.push([part]);
    }
    const firstPriceX = columns[0][0].transform[4];
    const nameWords = tokens.filter(
      (word) => (originX + word.x + word.width / 2) / scale < firstPriceX - 8,
    );
    const name = nameWords
      .map((word) => word.text)
      .join(" ")
      .replace(/N\s*[º°*]/gi, "Nº")
      .trim();
    for (const columnParts of columns) {
      const x = Math.min(...columnParts.map((part) => part.transform[4]));
      const numericTails = columnParts.flatMap((part) =>
        fragments.filter(
          (other) =>
            Math.abs(other.transform[5] - part.transform[5]) < 2 &&
            other.transform[4] > part.transform[4] &&
            other.transform[4] < part.transform[4] + 110 &&
            /^[\d.,\s]+$/.test(other.str),
        ),
      );
      const right = Math.max(
        ...[...columnParts, ...numericTails].map((part) => part.transform[4] + part.width),
      );
      const [, screenY] = viewport.convertToViewportPoint(0, strip.baseline);
      const leftPx = Math.max(0, Math.floor((x - 6) * scale));
      const topPx = Math.max(0, Math.floor(screenY - 22 * scale));
      const cell = createCanvas(
        Math.min(canvas.width - leftPx, Math.ceil((right - x + 16) * scale)),
        Math.min(34 * scale, canvas.height - topPx),
      );
      cell
        .getContext("2d")
        .drawImage(canvas, leftPx, topPx, cell.width, cell.height, 0, 0, cell.width, cell.height);
      const pixels = cell.getContext("2d").getImageData(0, 0, cell.width, cell.height).data;
      let ink = 0;
      for (let i = 0; i < pixels.length; i += 4)
        if (pixels[i + 3] > 128 && pixels[i] < 120 && pixels[i + 1] < 120 && pixels[i + 2] < 120)
          ink++;
      // A hidden text layer can contain a price in a visually empty column.
      if (ink < 20) continue;
      await worker.setParameters({ tessedit_char_whitelist: "0123456789.,$USD" });
      const read = await worker.recognize(cell.toBuffer("image/png"));
      await worker.setParameters({ tessedit_char_whitelist: "" });
      const priceText = read.data.text.trim();
      const currency = columnParts.some((part) => /USD|US\$/i.test(compact(part.str)))
        ? "USD"
        : "ARS";
      const price = readMoney(
        currency === "USD" && !priceText.startsWith("USD") ? `USD${priceText}` : priceText,
      );
      const digitalPriceMatches =
        price != null &&
        columnParts.some((part) => {
          const tail = fragments
            .filter(
              (other) =>
                Math.abs(other.transform[5] - part.transform[5]) < 2 &&
                other.transform[4] >= part.transform[4] &&
                other.transform[4] < part.transform[4] + 110,
            )
            .sort((a, b) => a.transform[4] - b.transform[4])
            .map((p) => p.str)
            .join("");
          return readMoney(part.str) === price || readMoney(tail) === price;
        });
      const hasColumns = columns.length > 1 || headers.length > 1;
      const nearestHeader = headers
        .filter((header) => Math.abs(header.x - x) < 65)
        .sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
      const column = hasColumns ? nearestHeader?.text : undefined;
      const fullName = column
        ? `${name} · ${column}`
        : section
          ? `${name} · sección ${section}`
          : name;
      const verified =
        !!name &&
        price != null &&
        digitalPriceMatches &&
        digitalNameAgrees(name, fragments, x, strip.baseline) &&
        nameWords.every((word) => word.confidence >= 65) &&
        read.data.confidence >= 65 &&
        (!hasColumns || !!column) &&
        currency === "ARS" &&
        sectionVerified;
      const warning =
        currency !== "ARS"
          ? "Precio en USD: ingresá un costo en ARS antes de incluirlo"
          : price == null
            ? "Precio visual inválido"
            : hasColumns && !column
              ? "Dos columnas de precio sin presentación confirmada"
              : !sectionVerified
                ? "Confirmá la sección de planchuela indicada en el encabezado"
                : !verified
                  ? "La lectura visual y el texto del PDF requieren confirmación"
                  : undefined;
      rows.push({
        code: `MT-${createHash("sha256")
          .update(compact(fullName || `${pageNumber}:${strip.baseline}:${x}`))
          .digest("hex")
          .slice(0, 12)}`,
        name: fullName || "Artículo sin descripción",
        price,
        currency,
        page: pageNumber,
        documentY: strip.baseline,
        sourceBounds: strip.bounds,
        parserVersion: DESIGNED_PDF_VERSION,
        extraction: verified ? "verified" : "ocr",
        ...(warning ? { warning } : {}),
      });
    }
  }

  return rows;
}
