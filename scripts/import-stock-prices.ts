import "dotenv/config";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const source = process.argv.find((arg) => arg.endsWith(".xlsx"));
  const latestSource = process.argv.includes("--latest")
    ? process.argv[process.argv.indexOf("--latest") + 1]
    : undefined;
  const apply = process.argv.includes("--apply");
  if (!source || path.basename(source) !== "Alambres Tandil.xlsx") {
    throw new Error("Indicá la versión original: Alambres Tandil.xlsx");
  }

  const bytes = await readFile(source);
  const hash = createHash("sha256").update(bytes).digest("hex");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(source);
  const sheet = workbook.getWorksheet("Stock");
  if (!sheet || sheet.getCell("E1").value !== "Precio Final") {
    throw new Error("No se encontró Stock!E:E con el encabezado Precio Final.");
  }
  const latestWorkbook = latestSource ? new ExcelJS.Workbook() : null;
  if (latestWorkbook && latestSource) await latestWorkbook.xlsx.readFile(latestSource);
  const latestSheet = latestWorkbook?.getWorksheet("Stock");
  if (latestSource && (!latestSheet || latestSheet.getCell("E1").value !== "Precio Final")) {
    throw new Error("La versión reciente no contiene Stock!E:E.");
  }

  const normalize = (value: unknown) =>
    String(value ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase();
  const prisma = new PrismaClient();
  try {
    const products = await prisma.product.findMany({
      include: { variants: true },
      orderBy: { slug: "asc" },
    });
    const updates: { id: string; sku: string; price: Prisma.Decimal }[] = [];
    const missing: string[] = [];
    const planned = new Map<string, Prisma.Decimal>();
    const latestRows = new Map<string, { row: number; value: number }>();
    if (latestSheet) {
      for (let number = 2; number <= latestSheet.rowCount; number++) {
        const row = latestSheet.getRow(number);
        const name = `${normalize(row.getCell(1).value)}|${normalize(row.getCell(2).value)}`;
        const value = row.getCell(5).value;
        if (name && typeof value === "number" && value > 0) {
          if (latestRows.has(name))
            throw new Error(`Nombre duplicado en versión reciente: ${name}`);
          latestRows.set(name, { row: number, value });
        }
      }
    }
    const overrides: string[] = [];

    for (const product of products) {
      for (const variant of product.variants) {
        const rowMatch = variant.sourceReference?.match(
          /^Alambres Tandil\.xlsx · Stock!A(\d+):B\1$/,
        );
        if (!rowMatch) throw new Error(`Referencia de origen inesperada: ${variant.sku}`);
        const row = sheet.getRow(Number(rowMatch[1]));
        if (normalize(row.getCell(1).value) !== normalize(variant.name)) {
          throw new Error(`El nombre no coincide con Stock!A${row.number}: ${variant.sku}`);
        }
        const value = row.getCell(5).value;
        if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
          missing.push(`${variant.sku} (${variant.name})`);
          continue;
        }
        const originalPrice = new Prisma.Decimal(value).toDecimalPlaces(2);
        const latest = latestRows.get(
          `${normalize(variant.name)}|${normalize(row.getCell(2).value)}`,
        );
        const price = latest ? new Prisma.Decimal(latest.value).toDecimalPlaces(2) : originalPrice;
        if (latest && !price.equals(originalPrice))
          overrides.push(`${variant.sku}: Stock!E${latest.row}`);
        planned.set(variant.id, price);
        if (
          variant.price !== null &&
          !variant.price.equals(price) &&
          !variant.price.equals(originalPrice)
        ) {
          throw new Error(
            `El precio existente de ${variant.sku} difiere del Excel; revisar manualmente.`,
          );
        }
        if (variant.price === null || !variant.price.equals(price)) {
          updates.push({ id: variant.id, sku: variant.sku, price });
        }
      }
    }

    const families = products.map((product) => {
      const active = product.variants.filter((variant) => variant.active);
      const prices = active.map((variant) => planned.get(variant.id));
      const complete = active.length > 0 && prices.every((price) => price !== undefined);
      return {
        id: product.id,
        slug: product.slug,
        price: complete
          ? prices.reduce((min, price) => (price!.lessThan(min!) ? price : min))!
          : null,
        visibility: complete ? (active.length > 1 ? "FROM" : "PUBLIC") : "HIDDEN",
      } as const;
    });

    console.log(
      JSON.stringify(
        {
          source: path.basename(source),
          sha256: hash,
          latestSource: latestSource ? path.basename(latestSource) : null,
          latestOverrides: overrides,
          matchedPrices: planned.size,
          variantUpdates: updates.length,
          publicFamilies: families.filter((item) => item.visibility !== "HIDDEN").length,
          withoutPrice: missing,
        },
        null,
        2,
      ),
    );
    if (apply) {
      await prisma.$transaction(
        async (tx) => {
          for (const item of updates) {
            await tx.productVariant.update({ where: { id: item.id }, data: { price: item.price } });
          }
          for (const item of families) {
            await tx.product.update({
              where: { id: item.id },
              data: { price: item.price, priceVisibility: item.visibility },
            });
          }
          await tx.siteSetting.upsert({
            where: { key: "stock-prices-source" },
            create: {
              key: "stock-prices-source",
              value: `Alambres Tandil.xlsx · Stock!E · SHA256 ${hash}${latestSource ? `; ${path.basename(latestSource)}: ${overrides.join(", ")}` : ""}`,
            },
            update: {
              value: `Alambres Tandil.xlsx · Stock!E · SHA256 ${hash}${latestSource ? `; ${path.basename(latestSource)}: ${overrides.join(", ")}` : ""}`,
            },
          });
        },
        { timeout: 120000 },
      );
      console.log("Precios aplicados.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
