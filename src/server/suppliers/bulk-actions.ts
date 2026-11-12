"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireArea } from "@/server/rbac";
import { priceValue } from "@/server/products/validation";
import { parseSupplierFile, type ImportedRow } from "./parse";
import { buildSupplierReviewPlan, COMPANY_STOCK_SOURCE, supplierIdentity } from "./review-plan";
import { supplierReviewRevision } from "./review-revision";
import { mergeReprocessedRows } from "./reprocess";

const rowEdit = z.object({
  index: z.number().int().min(0),
  name: z.string().trim().max(500),
  price: z.string().max(50),
  unit: z.string().max(150),
  variantId: z.string().max(150),
  currency: z.enum(["ARS", "USD"]),
});
function listInput(form: FormData) {
  return {
    listId: z.string().min(1).parse(form.get("listId")),
    revision: z.string().length(64).parse(form.get("revision")),
  };
}
function ensureCurrent(list: { status: string; rows: unknown }, revision: string) {
  if (list.status !== "REVIEW") throw new Error("Esta lista ya fue procesada.");
  if (supplierReviewRevision(list.rows) !== revision)
    throw new Error(
      "La lista cambió en otra pestaña. Actualizá antes de guardar; no se aplicó ningún cambio.",
    );
}

export async function reviewSupplierRows(form: FormData) {
  await requireArea("suppliers");
  const { listId, revision } = listInput(form);
  const mode = z.enum(["include", "exclude"]).parse(form.get("mode"));
  const raw = z.string().max(500_000).parse(form.get("edits"));
  const edits = z
    .array(rowEdit)
    .min(1, "Seleccioná al menos un artículo")
    .max(500)
    .parse(JSON.parse(raw));
  if (new Set(edits.map((edit) => edit.index)).size !== edits.length)
    throw new Error("Hay filas repetidas en la selección.");
  if (mode === "include" && form.get("confirmed") !== "on")
    throw new Error("Confirmá los productos, medidas y costos de la selección.");
  const supplierId = await prisma.$transaction(
    async (tx) => {
      const list = await tx.supplierPriceList.findUniqueOrThrow({ where: { id: listId } });
      ensureCurrent(list, revision);
      const rows = structuredClone(list.rows as ImportedRow[]);
      if (edits.some((edit) => !rows[edit.index]))
        throw new Error("Una fila ya no existe. Actualizá la lista.");
      if (mode === "exclude") {
        for (const edit of edits) rows[edit.index].excluded = true;
      } else {
        const [variants, previous] = await Promise.all([
          tx.productVariant.findMany({
            where: { active: true, sourceReference: { startsWith: COMPANY_STOCK_SOURCE } },
            select: {
              id: true,
              name: true,
              salesUnit: true,
              sourceReference: true,
              product: { select: { salesUnit: true } },
            },
          }),
          tx.supplierItem.findMany({
            where: { supplierId: list.supplierId },
            select: { code: true, name: true, unit: true, variantId: true, listPrice: true },
          }),
        ]);
        const byId = new Map(variants.map((variant) => [variant.id, variant]));
        const plan = buildSupplierReviewPlan(
          rows,
          variants.map((v) => ({ ...v, unit: v.salesUnit ?? v.product.salesUnit })),
          previous.map((item) => ({
            ...item,
            listPrice: item.listPrice == null ? null : Number(item.listPrice),
          })),
        );
        for (const edit of edits) {
          if (edit.name.length < 2)
            throw new Error(`Artículo ${edit.index + 1}: completá la descripción.`);
          const variant = byId.get(edit.variantId);
          if (!variant)
            throw new Error(`Artículo ${edit.index + 1}: elegí una medida activa del catálogo.`);
          if (edit.currency !== "ARS")
            throw new Error(
              `Artículo ${edit.index + 1}: convertí el costo a ARS antes de incluirlo.`,
            );
          const price = priceValue(edit.price);
          if (price == null || !Number.isFinite(price) || price <= 0 || price > 9_999_999_999.99)
            throw new Error(`Artículo ${edit.index + 1}: ingresá un costo válido mayor a cero.`);
          const unit = edit.unit.trim() || variant.salesUnit || variant.product.salesUnit;
          if (
            supplierIdentity(unit) !==
            supplierIdentity(variant.salesUnit ?? variant.product.salesUnit)
          )
            throw new Error(
              `Artículo ${edit.index + 1}: la unidad no corresponde a la medida elegida.`,
            );
          rows[edit.index] = {
            ...rows[edit.index],
            sourceName: rows[edit.index].sourceName ?? rows[edit.index].name,
            sourcePrice: Object.hasOwn(rows[edit.index], "sourcePrice")
              ? rows[edit.index].sourcePrice
              : rows[edit.index].price,
            sourceCurrency: rows[edit.index].sourceCurrency ?? rows[edit.index].currency ?? "ARS",
            name: edit.name,
            price,
            unit,
            currency: "ARS",
            code: plan[edit.index].supplierCode ?? rows[edit.index].code,
            variantId: variant.id,
            warning: undefined,
            reviewed: true,
            excluded: false,
          };
        }
        const included = rows.filter((row) => !row.excluded && row.variantId);
        if (new Set(included.map((row) => row.variantId)).size !== included.length)
          throw new Error(
            "Dos artículos apuntan a la misma medida. Corregí el vínculo u omití el duplicado.",
          );
        const active = rows.filter((row) => !row.excluded && (row.reviewed || row.variantId));
        if (new Set(active.map((row) => row.code)).size !== active.length)
          throw new Error("Hay códigos repetidos. Omití los duplicados antes de confirmar.");
      }
      await tx.supplierPriceList.update({ where: { id: listId }, data: { rows } });
      return list.supplierId;
    },
    { isolationLevel: "Serializable", timeout: 30_000 },
  );
  revalidatePath(`/admin/proveedores/${supplierId}`);
}

export async function reprocessSupplierList(form: FormData) {
  await requireArea("suppliers");
  const { listId, revision } = listInput(form);
  const original = await prisma.supplierPriceList.findUniqueOrThrow({
    where: { id: listId },
    include: { supplier: { select: { name: true } } },
  });
  ensureCurrent(original, revision);
  const parsed = await parseSupplierFile(
    original.filename,
    Buffer.from(original.content),
    original.supplier.name,
  );
  if (!parsed.rows.length)
    throw new Error("No se pudo recuperar una lectura completa. Se conservó la lista anterior.");
  await prisma.$transaction(
    async (tx) => {
      const current = await tx.supplierPriceList.findUniqueOrThrow({ where: { id: listId } });
      ensureCurrent(current, revision);
      const previous = current.rows as ImportedRow[];
      const rows = mergeReprocessedRows(previous, parsed.rows);
      const snapshot = previous.map((row) => {
        const copy = { ...row };
        delete copy.readBackup;
        return copy;
      });
      rows[0].readBackup = {
        rowsJson: JSON.stringify(snapshot),
        notes: current.notes,
        createdAt: new Date().toISOString(),
      };
      await tx.supplierPriceList.update({
        where: { id: listId },
        data: { rows, notes: parsed.notes },
      });
    },
    { isolationLevel: "Serializable", timeout: 30_000 },
  );
  revalidatePath(`/admin/proveedores/${original.supplierId}`);
}

export async function restoreSupplierRead(form: FormData) {
  await requireArea("suppliers");
  const { listId, revision } = listInput(form);
  if (form.get("confirmed") !== "on")
    throw new Error("Confirmá que querés restaurar la lectura anterior.");
  const supplierId = await prisma.$transaction(
    async (tx) => {
      const list = await tx.supplierPriceList.findUniqueOrThrow({ where: { id: listId } });
      ensureCurrent(list, revision);
      const backup = (list.rows as ImportedRow[])[0]?.readBackup;
      if (!backup) throw new Error("No hay una lectura anterior para restaurar.");
      await tx.supplierPriceList.update({
        where: { id: listId },
        data: { rows: JSON.parse(backup.rowsJson), notes: backup.notes },
      });
      return list.supplierId;
    },
    { isolationLevel: "Serializable", timeout: 30_000 },
  );
  revalidatePath(`/admin/proveedores/${supplierId}`);
}
