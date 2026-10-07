import { prisma } from "@/lib/db";
import { applyStock, roundQuantity, type MovementType } from "@/features/inventory/stock";

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
    const variant = await tx.productVariant.findUniqueOrThrow({ where: { id: input.variantId }, include: { product: { select: { salesUnit: true } } } });
    const unit = variant.salesUnit ?? variant.product.salesUnit;
    if (!["KG", "METRO"].includes(unit) && !Number.isInteger(input.quantity)) throw new Error("Esta unidad de venta requiere cantidades enteras.");
    const next = applyStock(
      { onHand: inventory.onHand, reserved: inventory.reserved },
      input.type,
      input.quantity,
    );
    if (next.onHand < 0) throw new Error("El stock no puede quedar negativo.");
    if (next.onHand < next.reserved) throw new Error("El stock físico no puede ser menor al reservado.");

    await tx.inventory.update({
      where: { id: inventory.id },
      data: { onHand: next.onHand, reserved: next.reserved },
    });

    return tx.stockMovement.create({
      data: {
        variantId: input.variantId,
        type: input.type,
        quantity: roundQuantity(input.quantity),
        onHandAfter: next.onHand,
        reservedAfter: next.reserved,
        reason: input.reason,
        reference: input.reference,
        userId: input.userId,
      },
    });
  });
}
