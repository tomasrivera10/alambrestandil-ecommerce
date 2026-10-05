import { prisma } from "@/lib/db";

export function countStaleOrders(hours = 48) {
  const staleCutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return prisma.order.count({
    where: {
      status: { in: ["NUEVO", "ENVIADO_A_WHATSAPP", "CONTACTADO"] },
      updatedAt: { lt: staleCutoff },
    },
  });
}
