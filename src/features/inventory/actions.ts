"use server";

import { revalidatePath } from "next/cache";
import { requireArea } from "@/lib/rbac";
import { writeMovement } from "@/features/inventory/ledger";
import type { MovementType } from "@/features/inventory/stock";
import { z } from "zod";

export async function recordStockForm(formData: FormData) {
  const actor = await requireArea("inventory");
  const input = z
    .object({
      variantId: z.string().min(1),
      type: z.enum(["ENTRADA", "VENTA", "AJUSTE", "DEVOLUCION"]),
      quantity: z.coerce
        .number()
        .finite()
        .refine((n) => n !== 0),
      reason: z.string().min(3),
    })
    .parse(Object.fromEntries(formData));
  if (input.type !== "AJUSTE" && input.quantity < 0)
    throw new Error("Usá una cantidad positiva. Para restar por recuento elegí Ajuste.");
  await writeMovement({
    variantId: input.variantId,
    type: input.type as MovementType,
    quantity: input.quantity,
    reason: input.reason,
    userId: actor.userId,
  });
  revalidatePath("/", "layout");
}
