import { prisma } from "@/lib/db";
import { applyStock, type MovementType } from "@/features/inventory/stock";

export async function writeMovement(input: {
  variantId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  reference?: string;
  userId?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.findUnique({ where: { variantId: input.variantId } });
    if (!inventory) throw new Error("La variante no tiene inventario.");
    const next = applyStock(
      { onHand: inventory.onHand, reserved: inventory.reserved },
      input.type,
      input.quantity,
    );
    if (next.onHand < 0) throw new Error("El stock no puede quedar negativo.");

    await tx.inventory.update({
      where: { id: inventory.id },
      data: { onHand: next.onHand, reserved: next.reserved },
    });

    return tx.stockMovement.create({
      data: {
        variantId: input.variantId,
        type: input.type,
        quantity: Math.trunc(input.quantity),
        onHandAfter: next.onHand,
        reservedAfter: next.reserved,
        reason: input.reason,
        reference: input.reference,
        userId: input.userId,
      },
    });
  });
}
