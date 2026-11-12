"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { requireArea } from "@/server/rbac";
import { z } from "zod";
import { priceValue } from "@/server/products/validation";
import { supplierReviewRevision } from "./review-revision";
import type { ImportedRow } from "./parse";
import { buildSupplierReviewPlan, COMPANY_STOCK_SOURCE } from "./review-plan";

export async function prepareSupplierSelection(form: FormData) {
  await requireArea("suppliers");
  const listId = z.string().min(1).parse(form.get("listId"));
  if (form.get("confirmed") !== "on")
    throw new Error("Confirmá que comparaste la selección con la lista original.");
  const selected = new Set(
    form.getAll("selected").map((value) => z.coerce.number().int().min(0).parse(value)),
  );
  const supplierId = await prisma.$transaction(
    async (tx) => {
      const list = await tx.supplierPriceList.findUniqueOrThrow({ where: { id: listId } });
      if (list.status !== "REVIEW") throw new Error("La lista ya fue procesada.");
      const rows = list.rows as ImportedRow[];
      if (selected.size === 0) throw new Error("Seleccioná al menos una coincidencia exacta.");
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
      const plan = buildSupplierReviewPlan(
        rows,
        variants.map((v) => ({
          id: v.id,
          name: v.name,
          unit: v.salesUnit ?? v.product.salesUnit,
          sourceReference: v.sourceReference,
        })),
        previous.map((item) => ({
          ...item,
          listPrice: item.listPrice == null ? null : Number(item.listPrice),
        })),
      );
      for (const index of selected) {
        if (index >= rows.length || !["exact", "confirmed"].includes(plan[index].kind))
          throw new Error("Una fila cambió o requiere revisión individual. Actualizá la página.");
      }
      const variantById = new Map(variants.map((variant) => [variant.id, variant]));
      const next = rows.map((row, index) =>
        selected.has(index)
          ? {
              ...row,
              code: plan[index].supplierCode ?? row.code,
              variantId: plan[index].variantId!,
              unit:
                row.unit ||
                variantById.get(plan[index].variantId!)?.salesUnit ||
                variantById.get(plan[index].variantId!)?.product.salesUnit,
              warning: undefined,
              reviewed: true,
              currency: "ARS" as const,
              excluded: false,
            }
          : row,
      );
      await tx.supplierPriceList.update({ where: { id: listId }, data: { rows: next } });
      return list.supplierId;
    },
    { isolationLevel: "Serializable", timeout: 30_000 },
  );
  revalidatePath(`/admin/proveedores/${supplierId}`);
}

export async function createSupplier(form: FormData) {
  await requireArea("suppliers");
  const name = z.string().trim().min(2).max(120).parse(form.get("name"));
  await prisma.supplier.create({ data: { name } });
  revalidatePath("/admin/proveedores");
}

export async function approveSupplierList(listId: string, revision?: string) {
  await requireArea("suppliers");
  const supplierId = await prisma.$transaction(
    async (tx) => {
      const list = await tx.supplierPriceList.findUniqueOrThrow({ where: { id: listId } });
      if (list.status !== "REVIEW") throw new Error("La lista ya fue procesada.");
      if (revision && supplierReviewRevision(list.rows) !== revision)
        throw new Error("La lista cambió desde tu revisión. Actualizá antes de aprobar.");
      const rows = (list.rows as ImportedRow[]).filter((row) => !row.excluded);
      if (
        rows.length === 0 ||
        rows.some(
          (row) =>
            !row.code ||
            !row.name ||
            row.price == null ||
            !Number.isFinite(row.price) ||
            row.price <= 0 ||
            (row.currency != null && row.currency !== "ARS") ||
            row.warning ||
            (!row.reviewed && !(row.variantId && !row.warning && row.extraction !== "ocr")),
        )
      )
        throw new Error("Revisá todas las filas antes de aprobar.");
      if (new Set(rows.map((row) => row.code)).size !== rows.length)
        throw new Error("Hay códigos repetidos en la lista.");
      if (rows.some((row) => !row.variantId))
        throw new Error(
          "Cada artículo incluido debe estar vinculado a una medida del Excel Stock.",
        );
      const variantIds = [...new Set(rows.map((row) => row.variantId!))];
      if (variantIds.length !== rows.length)
        throw new Error("Dos filas apuntan a la misma medida. Revisá los artículos duplicados.");
      if (variantIds.length) {
        const variants = await tx.productVariant.findMany({
          where: {
            id: { in: variantIds },
            active: true,
            sourceReference: { startsWith: COMPANY_STOCK_SOURCE },
          },
          select: { id: true },
        });
        if (variants.length !== variantIds.length)
          throw new Error("Una medida vinculada ya no existe. Revisá la lista antes de aprobar.");
      }
      const previousItems = await tx.supplierItem.findMany({
        where: { supplierId: list.supplierId, code: { in: rows.map((row) => row.code) } },
        select: {
          code: true,
          name: true,
          unit: true,
          variantId: true,
          listPrice: true,
          purchased: true,
        },
      });
      const previousByCode = new Map(previousItems.map((item) => [item.code, item]));
      const approvedRows = structuredClone(list.rows as ImportedRow[]);
      for (const row of rows) {
        const previous = previousByCode.get(row.code);
        const preserveLink = previous?.name === row.name && previous?.unit === (row.unit || null);
        const applied = await tx.supplierItem.upsert({
          where: { supplierId_code: { supplierId: list.supplierId, code: row.code } },
          create: {
            supplierId: list.supplierId,
            code: row.code,
            name: row.name,
            listPrice: row.price,
            unit: row.unit || null,
            variantId: row.variantId || null,
            purchased: true,
          },
          update: {
            name: row.name,
            listPrice: row.price,
            unit: row.unit || null,
            variantId: row.variantId || (preserveLink ? previous?.variantId : null),
            purchased: true,
          },
        });
        const saved = approvedRows.find((item) => !item.excluded && item.code === row.code)!;
        saved.previousItem = previous
          ? {
              name: previous.name,
              unit: previous.unit,
              listPrice: previous.listPrice == null ? null : Number(previous.listPrice),
              variantId: previous.variantId,
              purchased: previous.purchased,
            }
          : null;
        saved.appliedItemId = applied.id;
        saved.appliedUpdatedAt = applied.updatedAt.toISOString();
      }
      await tx.supplierPriceList.update({
        where: { id: listId },
        data: { status: "APPROVED", approvedAt: new Date(), rows: approvedRows },
      });
      return list.supplierId;
    },
    { timeout: 120_000, isolationLevel: "Serializable" },
  );
  revalidatePath("/admin/proveedores");
  revalidatePath(`/admin/proveedores/${supplierId}`);
}

export async function reviewSupplierRow(form: FormData) {
  await requireArea("suppliers");
  const listId = z.string().parse(form.get("listId"));
  const index = z.coerce.number().int().min(0).parse(form.get("index"));
  const name = z.string().trim().min(2).parse(form.get("name"));
  const code = z.string().trim().min(1).parse(form.get("code"));
  const price = priceValue(String(form.get("price")));
  if (price == null || price <= 0)
    throw new Error("Ingresá un costo mayor a cero, por ejemplo 12500,50.");
  if (form.get("confirmed") !== "on")
    throw new Error("Confirmá que revisaste esta fila contra el documento.");
  const unit = String(form.get("unit") || "").trim();
  const variantId = String(form.get("variantId") || "");
  if (!variantId) throw new Error("Vinculá una medida de la hoja Stock antes de confirmar.");
  const variant = await prisma.productVariant.findUniqueOrThrow({
    where: { id: variantId },
    include: { product: { select: { salesUnit: true } } },
  });
  if (!variant.active || !variant.sourceReference?.startsWith(COMPANY_STOCK_SOURCE))
    throw new Error("Por ahora solo se admiten productos de Alambres Tandil.xlsx, hoja Stock.");
  const supplierId = await prisma.$transaction(
    async (tx) => {
      const list = await tx.supplierPriceList.findUniqueOrThrow({ where: { id: listId } });
      if (list.status !== "REVIEW") throw new Error("La lista ya está aprobada.");
      const rows = list.rows as ImportedRow[];
      if (!rows[index]) throw new Error("Fila inexistente.");
      rows[index] = {
        ...rows[index],
        name,
        code,
        price,
        unit: unit || variant.salesUnit || variant.product.salesUnit,
        variantId,
        warning: undefined,
        reviewed: true,
        excluded: false,
      };
      await tx.supplierPriceList.update({ where: { id: listId }, data: { rows } });
      return list.supplierId;
    },
    { isolationLevel: "Serializable", timeout: 30_000 },
  );
  revalidatePath(`/admin/proveedores/${supplierId}`);
}

export async function updateSupplierItem(form: FormData) {
  await requireArea("suppliers");
  const id = z.string().parse(form.get("id"));
  const variantId = String(form.get("variantId") || "");
  if (variantId && form.get("exact") !== "on")
    throw new Error("Confirmá que el artículo y su unidad corresponden a esta medida.");
  if (variantId) {
    const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    if (!variant.active || !variant.sourceReference?.startsWith(COMPANY_STOCK_SOURCE))
      throw new Error("Por ahora solo se admiten productos de Alambres Tandil.xlsx, hoja Stock.");
  }
  const item = await prisma.supplierItem.update({
    where: { id },
    data: { purchased: form.get("purchased") === "on", variantId: variantId || null },
  });
  revalidatePath(`/admin/proveedores/${item.supplierId}`);
}

export async function excludeSupplierRow(form: FormData) {
  await requireArea("suppliers");
  const listId = z.string().min(1).parse(form.get("listId"));
  const index = z.coerce.number().int().min(0).parse(form.get("index"));
  await prisma.$transaction(async (tx) => {
    const list = await tx.supplierPriceList.findUniqueOrThrow({ where: { id: listId } });
    if (list.status !== "REVIEW") throw new Error("La lista ya está aprobada.");
    const rows = list.rows as ImportedRow[];
    if (!rows[index]) throw new Error("Fila inexistente.");
    rows[index] = { ...rows[index], excluded: !rows[index].excluded };
    await tx.supplierPriceList.update({ where: { id: listId }, data: { rows } });
  });
  revalidatePath("/admin", "layout");
}

export async function approveSupplierListForm(form: FormData) {
  await approveSupplierList(
    z.string().min(1).parse(form.get("listId")),
    z.string().length(64).parse(form.get("revision")),
  );
}

export async function rollbackSupplierList(form: FormData) {
  await requireArea("suppliers");
  const listId = z.string().min(1).parse(form.get("listId"));
  if (form.get("confirmed") !== "on")
    throw new Error("Confirmá que querés restaurar los costos anteriores.");
  const supplierId = await prisma.$transaction(
    async (tx) => {
      const list = await tx.supplierPriceList.findUniqueOrThrow({ where: { id: listId } });
      if (list.status !== "APPROVED") throw new Error("Esta lista no se puede revertir.");
      const rows = (list.rows as ImportedRow[]).filter((row) => !row.excluded);
      if (
        !rows.length ||
        rows.some(
          (row) => !row.appliedItemId || !row.appliedUpdatedAt || row.previousItem === undefined,
        )
      )
        throw new Error("Esta lista no tiene respaldo de costos anteriores.");
      for (const row of rows) {
        const item = await tx.supplierItem.findUnique({ where: { id: row.appliedItemId! } });
        if (
          !item ||
          item.supplierId !== list.supplierId ||
          item.updatedAt.toISOString() !== row.appliedUpdatedAt
        )
          throw new Error(
            "Hay artículos modificados después de esta aprobación. No se revirtió ningún costo.",
          );
        if (row.previousItem) {
          await tx.supplierItem.update({ where: { id: item.id }, data: row.previousItem });
        } else {
          await tx.supplierItem.delete({ where: { id: item.id } });
        }
      }
      await tx.supplierPriceList.update({ where: { id: listId }, data: { status: "ROLLED_BACK" } });
      return list.supplierId;
    },
    { isolationLevel: "Serializable", timeout: 120_000 },
  );
  revalidatePath(`/admin/proveedores/${supplierId}`);
  revalidatePath("/admin/proveedores");
}

export async function excludeSupplierRows(form: FormData) {
  await requireArea("suppliers");
  const listId = z.string().min(1).parse(form.get("listId"));
  const indices = new Set(
    form.getAll("selected").map((value) => z.coerce.number().int().min(0).parse(value)),
  );
  if (!indices.size) throw new Error("Marcá los artículos que querés omitir.");
  const supplierId = await prisma.$transaction(
    async (tx) => {
      const list = await tx.supplierPriceList.findUniqueOrThrow({ where: { id: listId } });
      if (list.status !== "REVIEW") throw new Error("La lista ya fue procesada.");
      const rows = list.rows as ImportedRow[];
      if ([...indices].some((index) => index >= rows.length)) throw new Error("Fila inexistente.");
      await tx.supplierPriceList.update({
        where: { id: listId },
        data: {
          rows: rows.map((row, index) => (indices.has(index) ? { ...row, excluded: true } : row)),
        },
      });
      return list.supplierId;
    },
    { isolationLevel: "Serializable", timeout: 30_000 },
  );
  revalidatePath(`/admin/proveedores/${supplierId}`);
}
