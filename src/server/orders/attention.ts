import { prisma } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";

export function staleOrderFilter(hours = 48): Prisma.OrderWhereInput {
  return {
    status: { in: ["NUEVO", "ENVIADO_A_WHATSAPP", "CONTACTADO"] },
    updatedAt: { lt: new Date(Date.now() - hours * 60 * 60 * 1000) },
  };
}

export function countStaleOrders(hours = 48) {
  return prisma.order.count({ where: staleOrderFilter(hours) });
}
