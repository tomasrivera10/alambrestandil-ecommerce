"use server";

import { revalidatePath } from "next/cache";
import { requireArea } from "@/lib/rbac";
import { writeMovement, writeCount } from "@/features/inventory/ledger";
import type { MovementType } from "@/features/inventory/stock";
import { z } from "zod";

export async function recordStockForm(formData: FormData) {
  const actor = await requireArea("inventory");
  const input = z
    .object({
      variantId: z.string().min(1),
      type: z.enum(["ENTRADA", "AJUSTE", "DEVOLUCION"]),
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

export async function recordCountForm(formData: FormData) {
  const actor = await requireArea("inventory");
  const variantId = z.string().min(1).parse(formData.get("variantId"));
  const counted = z.coerce.number().finite().nonnegative().parse(formData.get("counted"));
  const reason = z.string().min(3).parse(formData.get("reason"));
  await writeCount({ variantId, counted, reason, userId: actor.userId });
  revalidatePath("/", "layout");
}
