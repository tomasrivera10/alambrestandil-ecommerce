"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isPlausiblePhone, normalizeArPhone } from "@/lib/phone";
import { checkoutSchema } from "@/features/orders/schema";
import { buildOrderWhatsappMessage, whatsappUrl } from "@/features/whatsapp/message";
import { decimalToNumber } from "@/lib/format";
import { site } from "@/content/site";

async function whatsappDigits() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: "whatsapp" } });
  return (setting?.value || process.env.WHATSAPP_NUMBER || site.phoneDigits).replace(/\D/g, "");
}

export async function createOrder(raw: unknown) {
  const input = checkoutSchema.parse(raw);
  if (!isPlausiblePhone(input.phone)) {
    throw new Error("Revisá el teléfono. Incluí característica.");
  }
  if (input.fulfillment === "ENVIO" && !input.address?.trim()) {
    throw new Error("Para envío necesitamos la dirección.");
  }

  const phone = normalizeArPhone(input.phone);
  const since = new Date(Date.now() - 60_000);
  const recent = await prisma.order.count({
    where: { customer: { phone }, createdAt: { gte: since } },
  });
  if (recent >= 3) {
    throw new Error("Esperá un minuto antes de enviar otro pedido.");
  }

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: input.items.map((item) => item.variantId) }, active: true },
    include: { product: true },
  });
  if (variants.length !== input.items.length) {
    throw new Error("Algún producto ya no está disponible.");
  }

  const order = await prisma.$transaction(async (tx) => {
    const counter = await tx.orderCounter.upsert({
      where: { id: 1 },
      update: { value: { increment: 1 } },
      create: { id: 1, value: 1048 },
    });

    const customer = await tx.customer.upsert({
      where: { phone },
      update: {
        name: input.name,
        locality: input.locality,
        address: input.address || undefined,
      },
      create: {
        name: input.name,
        phone,
        locality: input.locality,
        address: input.address,
      },
    });

    let estimated = 0;
    let hasPrice = false;
    const lines = input.items.map((item) => {
      const variant = variants.find((entry) => entry.id === item.variantId)!;
      const unitPrice = decimalToNumber(variant.price) ?? decimalToNumber(variant.product.price);
      const visibility = variant.product.priceVisibility;
      const lineTotal =
        unitPrice != null && visibility !== "HIDDEN" ? unitPrice * item.quantity : null;
      if (lineTotal != null) {
        estimated += lineTotal;
        hasPrice = true;
      }
      return {
        variantId: variant.id,
        name: `${variant.product.name} ${variant.name}`.trim(),
        sku: variant.sku,
        quantity: item.quantity,
        unit: variant.salesUnit ?? variant.product.salesUnit,
        unitPrice,
        lineTotal,
        notes: item.notes,
      };
    });

    const created = await tx.order.create({
      data: {
        number: counter.value,
        status: "NUEVO",
        customerId: customer.id,
        fulfillment: input.fulfillment,
        locality: input.locality,
        address: input.address,
        notes: input.notes,
        estimatedTotal: hasPrice ? estimated : null,
        items: { create: lines },
        history: {
          create: { toStatus: "NUEVO", note: "Pedido creado desde la web." },
        },
      },
      include: { items: true },
    });
    return created;
  });

  const message = buildOrderWhatsappMessage({
    number: order.number,
    lines: order.items.map((item) => ({
      name: item.name,
      quantity: decimalToNumber(item.quantity) ?? 0,
      unit: item.unit,
    })),
    locality: order.locality,
    fulfillment: order.fulfillment,
    notes: order.notes,
    estimatedTotal: decimalToNumber(order.estimatedTotal),
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "ENVIADO_A_WHATSAPP",
      whatsappOpenedAt: new Date(),
      history: {
        create: {
          fromStatus: "NUEVO",
          toStatus: "ENVIADO_A_WHATSAPP",
          note: "Se generó el mensaje de WhatsApp.",
        },
      },
    },
  });

  revalidatePath("/admin/pedidos");
  return {
    id: order.id,
    number: order.number,
    url: whatsappUrl(await whatsappDigits(), message),
  };
}
