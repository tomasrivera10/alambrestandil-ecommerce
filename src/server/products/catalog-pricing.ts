"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireArea } from "@/server/rbac";
import { invalidateCatalog } from "./cache";
import { priceValue } from "./validation";

const id = z.string().min(1);
const dateField = z.union([z.literal(""), z.iso.date()]);

function money(value: FormDataEntryValue | null) {
  return priceValue(String(value ?? ""));
}
function refresh() {
  invalidateCatalog();
  revalidatePath("/", "layout");
  revalidatePath("/admin/productos");
}
function date(value: string, end: boolean) {
  if (!value) return null;
  return new Date(`${value}T${end ? "23:59:59.999" : "00:00:00"}-03:00`);
}

export async function saveCatalogProduct(form: FormData) {
  await requireArea("products");
  const productId = id.parse(form.get("productId"));
  const purchasePrice = money(form.get("purchasePrice"));
  const price = money(form.get("price"));
  const discountPrice = money(form.get("discountPrice"));
  const published = form.get("published") === "on";
  const promotionName = z
    .string()
    .trim()
    .max(80)
    .parse(String(form.get("promotionName") ?? ""));
  const starts = dateField.parse(String(form.get("promotionStartsAt") ?? ""));
  const ends = dateField.parse(String(form.get("promotionEndsAt") ?? ""));
  const variants = await prisma.productVariant.findMany({
    where: { productId, active: true },
    select: { price: true, discountPrice: true },
  });
  if (
    published &&
    (variants.length
      ? variants.some(
          (variant) =>
            (variant.price == null ? price : Number(variant.price)) == null ||
            (variant.price == null ? price : Number(variant.price))! <= 0,
        )
      : price == null || price <= 0)
  ) {
    throw new Error(
      "Todas las presentaciones necesitan un precio de venta mayor a cero antes de publicar.",
    );
  }
  if (
    variants.some(
      (variant) =>
        variant.price == null &&
        variant.discountPrice != null &&
        (price == null || Number(variant.discountPrice) >= price),
    )
  ) {
    throw new Error(
      "Una oferta de presentación supera el nuevo precio de venta. Revisá sus precios antes de guardar.",
    );
  }
  if (discountPrice != null && (price == null || discountPrice <= 0 || discountPrice >= price)) {
    throw new Error("El precio de oferta debe ser mayor a cero y menor al precio de venta.");
  }
  if (starts && ends && starts > ends)
    throw new Error("La fecha de fin debe ser posterior al inicio.");
  const hasPromotion =
    discountPrice != null || variants.some((variant) => variant.discountPrice != null);
  await prisma.product.update({
    where: { id: productId },
    data: {
      purchasePrice,
      price,
      discountPrice,
      promotionName: hasPromotion ? promotionName || "Oferta" : null,
      promotionStartsAt: hasPromotion ? date(starts, false) : null,
      promotionEndsAt: hasPromotion ? date(ends, true) : null,
      status: published ? "ACTIVE" : "DRAFT",
      priceVisibility: published ? "PUBLIC" : "HIDDEN",
    },
  });
  refresh();
}

export async function saveCatalogVariant(form: FormData) {
  await requireArea("products");
  const variantId = id.parse(form.get("variantId"));
  const purchasePrice = money(form.get("purchasePrice"));
  const price = money(form.get("price"));
  const discountPrice = money(form.get("discountPrice"));
  const variant = await prisma.productVariant.findUniqueOrThrow({
    where: { id: variantId },
    select: { product: { select: { price: true, status: true } } },
  });
  const effectivePrice =
    price ?? (variant.product.price == null ? null : Number(variant.product.price));
  if (variant.product.status === "ACTIVE" && (effectivePrice == null || effectivePrice <= 0)) {
    throw new Error("La presentación publicada necesita un precio de venta mayor a cero.");
  }
  if (
    discountPrice != null &&
    (effectivePrice == null || discountPrice <= 0 || discountPrice >= effectivePrice)
  ) {
    throw new Error(
      "La oferta debe ser mayor a cero y menor al precio de venta de esta presentación.",
    );
  }
  await prisma.productVariant.update({
    where: { id: variantId },
    data: { purchasePrice, price, discountPrice },
  });
  refresh();
}
