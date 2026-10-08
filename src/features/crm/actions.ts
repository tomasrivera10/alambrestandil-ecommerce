"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireArea } from "@/lib/rbac";
import { canTransition, stockEffect } from "@/features/orders/transitions";
import { writeMovementInTransaction } from "@/features/inventory/ledger";
import type { OrderStatus } from "@/generated/prisma/client";

export async function updateOrderStatus(orderId: string, to: OrderStatus, note?: string) {
  const actor = await requireArea("orders");
  await prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (!order) throw new Error("Pedido inexistente.");
      if (!canTransition(order.status, to))
        throw new Error("Ese cambio de estado no está permitido.");
      const effect = stockEffect(order.status, to);
      if (effect) {
        for (const item of order.items) {
          if (!item.variantId) continue;
          await writeMovementInTransaction(tx, {
            variantId: item.variantId,
            type: effect,
            quantity: Number(item.quantity),
            reason: `Pedido AT-${order.number}: ${to}`,
            reference: order.id,
            userId: actor.userId,
          });
        }
      }
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: to,
          history: {
            create: { fromStatus: order.status, toStatus: to, note, userId: actor.userId },
          },
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
}

export async function addCustomerNote(customerId: string, body: string) {
  const actor = await requireArea("customers");
  await prisma.customerNote.create({
    data: { customerId, body, userId: actor.userId },
  });
  revalidatePath(`/admin/clientes/${customerId}`);
}

export async function setCustomerTags(customerId: string, tagNames: string[]) {
  await requireArea("customers");
  const tags = [];
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    tags.push(tag);
  }
  await prisma.customerTag.deleteMany({ where: { customerId } });
  if (tags.length) {
    await prisma.customerTag.createMany({
      data: tags.map((tag) => ({ customerId, tagId: tag.id })),
    });
  }
  revalidatePath(`/admin/clientes/${customerId}`);
}
