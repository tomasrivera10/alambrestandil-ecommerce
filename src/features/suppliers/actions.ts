"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireArea } from "@/lib/rbac";
import { z } from "zod";
import type { ImportedRow } from "./parse";

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
      const rows = list.rows as ImportedRow[];
      if (
        rows.length === 0 ||
        rows.some((row) => !row.code || !row.name || row.price == null || row.warning)
      )
        throw new Error("Revisá todas las filas antes de aprobar.");
      if (new Set(rows.map((row) => row.code)).size !== rows.length)
        throw new Error("Hay códigos repetidos en la lista.");
      for (const row of rows) {
        await tx.supplierItem.upsert({
          where: { supplierId_code: { supplierId: list.supplierId, code: row.code } },
          create: {
            supplierId: list.supplierId,
            code: row.code,
            name: row.name,
            listPrice: row.price,
          },
          update: { name: row.name, listPrice: row.price },
        });
      }
      await tx.supplierPriceList.update({
        where: { id: listId },
        data: { status: "APPROVED", approvedAt: new Date() },
      });
      return list.supplierId;
    },
    { timeout: 30_000 },
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
  const price = z.coerce.number().positive().parse(form.get("price"));
  const supplierId = await prisma.$transaction(async (tx) => {
    const list = await tx.supplierPriceList.findUniqueOrThrow({ where: { id: listId } });
    if (list.status !== "REVIEW") throw new Error("La lista ya está aprobada.");
    const rows = list.rows as ImportedRow[];
    if (!rows[index]) throw new Error("Fila inexistente.");
    rows[index] = { ...rows[index], name, code, price, warning: undefined };
    await tx.supplierPriceList.update({ where: { id: listId }, data: { rows } });
    return list.supplierId;
  });
  revalidatePath(`/admin/proveedores/${supplierId}`);
}

export async function updateSupplierItem(form: FormData) {
  await requireArea("suppliers");
  const id = z.string().parse(form.get("id"));
  const variantId = String(form.get("variantId") || "");
  const item = await prisma.supplierItem.update({
    where: { id },
    data: { purchased: form.get("purchased") === "on", variantId: variantId || null },
  });
  revalidatePath(`/admin/proveedores/${item.supplierId}`);
}
