"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isPlausiblePhone, normalizeArPhone } from "@/lib/phone";
import { ESTIMATE_DISCLAIMER, estimateFence } from "@/features/quotes/estimate";
import { whatsappUrl } from "@/features/whatsapp/message";
import { site } from "@/content/site";
import type { Prisma } from "@/generated/prisma/client";

const quoteSchema = z.object({
  origin: z.enum(["CALCULATOR", "INSTALLATION", "MANUAL"]),
  name: z.string().min(2),
  phone: z.string().min(8),
  locality: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  items: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().positive(),
        unit: z.enum(["UNIDAD", "METRO", "ROLLO", "KG", "PAQUETE", "PANEL", "JUEGO"]),
        note: z.string().optional(),
      }),
    )
    .min(1),
});

async function nextQuoteNumber() {
  const last = await prisma.quote.findFirst({ orderBy: { number: "desc" } });
  return (last?.number ?? 2000) + 1;
}

export async function createQuote(raw: unknown) {
  const input = quoteSchema.parse(raw);
  if (!isPlausiblePhone(input.phone)) throw new Error("Revisá el teléfono.");
  const phone = normalizeArPhone(input.phone);
  const customer = await prisma.customer.upsert({
    where: { phone },
    update: { name: input.name, locality: input.locality, address: input.address },
    create: { name: input.name, phone, locality: input.locality, address: input.address },
  });
  const quote = await prisma.quote.create({
    data: {
      number: await nextQuoteNumber(),
      origin: input.origin,
      customerId: customer.id,
      name: input.name,
      phone,
      locality: input.locality,
      address: input.address,
      notes: input.notes,
      disclaimer: ESTIMATE_DISCLAIMER,
      payload: (input.payload ?? {}) as Prisma.InputJsonValue,
      items: { create: input.items },
    },
    include: { items: true },
  });

  const setting = await prisma.siteSetting.findUnique({ where: { key: "whatsapp" } });
  const digits = (setting?.value || process.env.WHATSAPP_NUMBER || site.phoneDigits).replace(/\D/g, "");
  const message = [
    "Hola Alambres Tandil.",
    "",
    `Quiero consultar por el presupuesto CT-${quote.number}.`,
    "",
    ...quote.items.map(
      (item) => `• ${item.name}\n  ${Number(item.quantity)} ${item.unit.toLowerCase()}`,
    ),
    "",
    input.locality ? `Localidad: ${input.locality}` : "",
    input.notes ? `Observaciones:\n${input.notes}` : "",
    "",
    ESTIMATE_DISCLAIMER,
  ]
    .filter(Boolean)
    .join("\n");

  revalidatePath("/admin/cotizaciones");
  return { number: quote.number, url: whatsappUrl(digits, message) };
}

export async function createEstimateQuote(formData: FormData) {
  const meters = Number(formData.get("meters"));
  const height = Number(formData.get("height"));
  const lines = estimateFence({
    terrain: String(formData.get("terrain") || "lote"),
    meters,
    height,
    mesh: String(formData.get("mesh") || "romboidal"),
    post: String(formData.get("post") || "olimpico"),
    gate: String(formData.get("gate") || "ninguno"),
    install: formData.get("install") === "si",
  });
  return createQuote({
    origin: "CALCULATOR",
    name: String(formData.get("name")),
    phone: String(formData.get("phone")),
    locality: String(formData.get("locality") || ""),
    notes: String(formData.get("notes") || ""),
    payload: { meters, height },
    items: lines.map((line) => ({
      name: line.note ? `${line.name}. ${line.note}` : line.name,
      quantity: line.quantity,
      unit: line.unit,
    })),
  });
}
