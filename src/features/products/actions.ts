"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireArea } from "@/lib/rbac";
import { writeMovement } from "@/features/inventory/ledger";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  sku: z.string().optional(),
  categoryId: z.string().min(1),
  shortDescription: z.string().min(8),
  technicalDescription: z.string().min(8),
  brand: z.string().optional(),
  salesUnit: z.enum(["UNIDAD", "METRO", "ROLLO", "KG", "PAQUETE", "PANEL", "JUEGO"]),
  priceVisibility: z.enum(["PUBLIC", "HIDDEN", "FROM"]),
  price: z.string().optional(),
  ctaType: z.enum(["ADD_TO_ORDER", "REQUEST_QUOTE", "CHECK_AVAILABILITY", "WHATSAPP", "BUILD_ORDER"]),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  featured: z.boolean().default(false),
  uses: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

function priceValue(raw?: string) {
  if (!raw?.trim()) return null;
  const value = Number(raw.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

export async function saveProduct(input: z.infer<typeof productSchema>) {
  await requireArea("products");
  const data = productSchema.parse(input);
  const payload = {
    name: data.name,
    slug: data.slug,
    sku: data.sku || null,
    categoryId: data.categoryId,
    shortDescription: data.shortDescription,
    technicalDescription: data.technicalDescription,
    brand: data.brand || null,
    salesUnit: data.salesUnit,
    priceVisibility: data.priceVisibility,
    price: priceValue(data.price),
    ctaType: data.ctaType,
    status: data.status,
    featured: data.featured,
    uses: data.uses?.split(",").map((item) => item.trim()).filter(Boolean) ?? [],
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
  };

  const product = data.id
    ? await prisma.product.update({ where: { id: data.id }, data: payload })
    : await prisma.product.create({ data: payload });

  revalidatePath("/productos");
  revalidatePath("/admin/productos");
  return product.id;
}

const variantSchema = z.object({
  id: z.string().optional(),
  productId: z.string(),
  sku: z.string().min(2),
  name: z.string().min(2),
  attributes: z.record(z.string(), z.string()),
  price: z.string().optional(),
  minStock: z.number().int().min(0).default(0),
  onHand: z.number().int().optional(),
});

export async function saveVariant(input: z.infer<typeof variantSchema>) {
  const actor = await requireArea("products");
  const data = variantSchema.parse(input);
  const variant = data.id
    ? await prisma.productVariant.update({
        where: { id: data.id },
        data: {
          sku: data.sku,
          name: data.name,
          attributes: data.attributes,
          price: priceValue(data.price),
        },
      })
    : await prisma.productVariant.create({
        data: {
          productId: data.productId,
          sku: data.sku,
          name: data.name,
          attributes: data.attributes,
          price: priceValue(data.price),
          inventory: { create: { onHand: 0, reserved: 0, minStock: data.minStock } },
        },
      });

  await prisma.inventory.upsert({
    where: { variantId: variant.id },
    update: { minStock: data.minStock },
    create: { variantId: variant.id, onHand: 0, reserved: 0, minStock: data.minStock },
  });

  if (!data.id && data.onHand && data.onHand > 0) {
    await writeMovement({
      variantId: variant.id,
      type: "ENTRADA",
      quantity: data.onHand,
      reason: "Carga inicial",
      userId: actor.userId,
    });
  }

  revalidatePath("/admin/productos");
  return variant.id;
}

export async function addProductImage(productId: string, url: string, alt: string) {
  await requireArea("products");
  await prisma.productImage.create({ data: { productId, url, alt, sortOrder: 0 } });
  revalidatePath("/admin/productos");
}
