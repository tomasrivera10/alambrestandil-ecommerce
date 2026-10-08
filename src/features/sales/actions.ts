"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireArea } from "@/lib/rbac";
import { z } from "zod";

const schema = z.object({
  channel: z.enum(["MOSTRADOR", "WHATSAPP"]),
  customerName: z.string().trim().max(120).optional(),
  lines: z
    .array(
      z.object({
        variantId: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
      }),
    )
    .min(1),
});

export async function recordCounterSale(raw: unknown) {
  const actor = await requireArea("orders");
  const input = schema.parse(raw);
  if (new Set(input.lines.map((line) => line.variantId)).size !== input.lines.length)
    throw new Error("Unificá las líneas del mismo producto.");
  const sale = await prisma.$transaction(
    async (tx) => {
      const variants = await tx.productVariant.findMany({
        where: { id: { in: input.lines.map((line) => line.variantId) }, active: true },
        include: { product: true, inventory: true },
      });
      if (variants.length !== input.lines.length)
        throw new Error("Algún producto no está disponible.");
      const data = input.lines.map((line) => {
        const variant = variants.find((entry) => entry.id === line.variantId)!;
        const unit = variant.salesUnit ?? variant.product.salesUnit;
        if (!["KG", "METRO"].includes(unit) && !Number.isInteger(line.quantity))
          throw new Error(`${variant.name} requiere cantidad entera.`);
        if (
          !variant.inventory ||
          variant.inventory.onHand - variant.inventory.reserved < line.quantity
        )
          throw new Error(`No hay stock suficiente de ${variant.name}.`);
        return { ...line, name: `${variant.product.name} · ${variant.name}` };
      });
      const created = await tx.counterSale.create({
        data: {
          channel: input.channel,
          customerName: input.customerName || null,
          total: data.reduce((total, line) => total + line.quantity * line.unitPrice, 0),
          lines: { create: data },
        },
      });
      for (const line of data) {
        const inventory = variants.find((entry) => entry.id === line.variantId)!.inventory!;
        const onHand = Math.round((inventory.onHand - line.quantity) * 1000) / 1000;
        await tx.inventory.update({ where: { id: inventory.id }, data: { onHand } });
        await tx.stockMovement.create({
          data: {
            variantId: line.variantId,
            type: "VENTA",
            quantity: line.quantity,
            onHandAfter: onHand,
            reservedAfter: inventory.reserved,
            reason: `Venta ${input.channel.toLowerCase()}`,
            reference: created.id,
            userId: actor.userId,
          },
        });
      }
      return created;
    },
    { isolationLevel: "Serializable" },
  );
  revalidatePath("/", "layout");
  return sale.id;
}
