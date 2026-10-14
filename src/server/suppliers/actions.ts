"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { requireArea } from "@/server/rbac";
import { z } from "zod";
import { priceValue } from "@/server/products/validation";
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
  const supplierId = await prisma.$transaction(async (tx) => {
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
        select: { code: true, name: true, unit: true, variantId: true },
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
      previous,
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
            variantId: plan[index].variantId!,
            unit:
              row.unit ||
              variantById.get(plan[index].variantId!)?.salesUnit ||
              variantById.get(plan[index].variantId!)?.product.salesUnit,
            warning: undefined,
            excluded: false,
          }
        : { ...row, excluded: true },
    );
    await tx.supplierPriceList.update({ where: { id: listId }, data: { rows: next } });
    return list.supplierId;
  });
  revalidatePath(`/admin/proveedores/${supplierId}`);
}

export async function createSupplier(form: FormData) {
  await requireArea("suppliers");
  const name = z.string().trim().min(2).max(120).parse(form.get("name"));
  await prisma.supplier.create({ data: { name } });
  revalidatePath("/admin/proveedores");
}

export async function approveSupplierList(listId: string) {
  await requireArea("suppliers");
  const supplierId = await prisma.$transaction(
    async (tx) => {
      const list = await tx.supplierPriceList.findUniqueOrThrow({ where: { id: listId } });
      if (list.status !== "REVIEW") throw new Error("La lista ya fue procesada.");
      const rows = (list.rows as ImportedRow[]).filter((row) => !row.excluded);
      if (
        rows.length === 0 ||
        rows.some((row) => !row.code || !row.name || row.price == null || row.warning)
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
        select: { code: true, name: true, unit: true, variantId: true },
      });
      const previousByCode = new Map(previousItems.map((item) => [item.code, item]));
      for (const row of rows) {
        const previous = previousByCode.get(row.code);
        const preserveLink = previous?.name === row.name && previous?.unit === (row.unit || null);
        await tx.supplierItem.upsert({
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
      }
      await tx.supplierPriceList.update({
        where: { id: listId },
        data: { status: "APPROVED", approvedAt: new Date() },
      });
      return list.supplierId;
    },
    { timeout: 120_000 },
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
  const supplierId = await prisma.$transaction(async (tx) => {
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
      excluded: false,
    };
    await tx.supplierPriceList.update({ where: { id: listId }, data: { rows } });
    return list.supplierId;
  });
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
  await approveSupplierList(z.string().min(1).parse(form.get("listId")));
}
