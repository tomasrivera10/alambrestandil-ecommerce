"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireArea } from "@/lib/rbac";
import { writeMovement } from "@/features/inventory/ledger";
import { priceValue, imageUrl, sourceUrl as validSourceUrl } from "./validation";

function refreshCatalog() {
  revalidatePath("/", "layout");
}

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sku: z.string().optional(),
  categoryId: z.string().min(1),
  shortDescription: z.string().min(8),
  technicalDescription: z.string().min(8),
  brand: z.string().optional(),
  salesUnit: z.enum(["UNIDAD", "METRO", "ROLLO", "KG", "PAQUETE", "PANEL", "JUEGO"]),
  priceVisibility: z.enum(["PUBLIC", "HIDDEN", "FROM"]),
  price: z.string().optional(),
  ctaType: z.enum([
    "ADD_TO_ORDER",
    "REQUEST_QUOTE",
    "CHECK_AVAILABILITY",
    "WHATSAPP",
    "BUILD_ORDER",
  ]),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  featured: z.boolean().default(false),
  uses: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  documentationUrl: z.string().optional(),
});

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
    uses:
      data.uses
        ?.split(",")
        .map((item) => item.trim())
        .filter(Boolean) ?? [],
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
    documentationUrl: validSourceUrl(data.documentationUrl),
  };

  const product = data.id
    ? await prisma.product.update({ where: { id: data.id }, data: payload })
    : await prisma.product.create({ data: payload });

  refreshCatalog();
  return product.id;
}

const variantSchema = z.object({
  id: z.string().optional(),
  productId: z.string(),
  sku: z.string().min(2),
  name: z.string().min(2),
  attributes: z.record(z.string(), z.string()),
  price: z.string().optional(),
  minStock: z.number().min(0).default(0),
  onHand: z.number().int().optional(),
  salesUnit: z
    .enum(["UNIDAD", "METRO", "ROLLO", "KG", "PAQUETE", "PANEL", "JUEGO"])
    .nullable()
    .default(null),
  active: z.boolean().default(true),
  reviewNote: z.string().nullable().optional(),
});

export async function saveVariant(input: z.infer<typeof variantSchema>) {
  const actor = await requireArea("products");
  const data = variantSchema.parse(input);
  const variant = data.id
    ? await prisma.productVariant.update({
        where: { id: data.id, productId: data.productId },
        data: {
          sku: data.sku,
          name: data.name,
          attributes: data.attributes,
          price: priceValue(data.price),
          salesUnit: data.salesUnit,
          active: data.active,
          reviewNote: data.reviewNote || null,
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
          salesUnit: data.salesUnit,
          active: data.active,
          reviewNote: data.reviewNote || null,
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

  refreshCatalog();
  return variant.id;
}

export async function addProductImage(
  productId: string,
  url: string,
  alt: string,
  sourceUrl?: string,
  isReference = false,
) {
  await requireArea("products");
  await prisma.$transaction(async (tx) => {
    const existing = await tx.productImage.aggregate({
      where: { productId },
      _max: { sortOrder: true },
    });
    await tx.productImage.create({
      data: {
        productId,
        url: imageUrl(url),
        alt: z.string().min(3).max(500).parse(alt),
        sourceUrl: validSourceUrl(sourceUrl),
        isReference: z.boolean().parse(isReference),
        sortOrder: (existing._max.sortOrder ?? -1) + 1,
      },
    });
  });
  refreshCatalog();
}

export async function removeProductImage(id: string, productId: string) {
  await requireArea("products");
  await prisma.productImage.delete({ where: { id, productId } });
  refreshCatalog();
}

export async function updateProductImage(
  id: string,
  productId: string,
  alt: string,
  sourceUrl: string,
  isReference: boolean,
) {
  await requireArea("products");
  await prisma.productImage.update({
    where: { id, productId },
    data: {
      alt: z.string().min(3).max(500).parse(alt),
      sourceUrl: validSourceUrl(sourceUrl),
      isReference: z.boolean().parse(isReference),
    },
  });
  refreshCatalog();
}

export async function setImageCover(id: string, productId: string) {
  await requireArea("products");
  await prisma.$transaction(async (tx) => {
    await tx.productImage.findUniqueOrThrow({ where: { id, productId } });
    await tx.productImage.updateMany({
      where: { productId },
      data: { sortOrder: { increment: 1 } },
    });
    await tx.productImage.update({ where: { id, productId }, data: { sortOrder: 0 } });
  });
  refreshCatalog();
}

export async function saveCategory(form: FormData) {
  await requireArea("products");
  const data = z
    .object({
      name: z.string().min(2),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      description: z.string(),
      sortOrder: z.coerce.number().int(),
      filterKeys: z.string(),
    })
    .parse(Object.fromEntries(form));
  const payload = {
    ...data,
    filterKeys: data.filterKeys
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
  const id = String(form.get("id") || "");
  if (id) await prisma.category.update({ where: { id }, data: payload });
  else await prisma.category.create({ data: payload });
  refreshCatalog();
}
