"use server";

import { revalidatePath } from "next/cache";
import { requireArea } from "@/lib/rbac";
import { writeMovement } from "@/features/inventory/ledger";
import type { MovementType } from "@/features/inventory/stock";

export async function recordStockForm(formData: FormData) {
  const actor = await requireArea("inventory");
  await writeMovement({
    variantId: String(formData.get("variantId")),
    type: String(formData.get("type")) as MovementType,
    quantity: Number(formData.get("quantity")),
    reason: String(formData.get("reason") || "Ajuste de depósito"),
    userId: actor.userId,
  });
  revalidatePath("/admin/stock");
}
