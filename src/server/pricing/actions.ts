"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { requireArea } from "@/server/rbac";
import { priceValue } from "@/server/products/validation";
import { invalidateCatalog } from "@/server/products/cache";
import { variantIdentity } from "@/features/pricing/calculation";
import { fetchMarketListing, validateMarketUrl, discoverMarket } from "./market";
import { pricingForVariant } from "./queries";
export async function saveMargin(form: FormData) {
  const actor = await requireArea("suppliers");
  const variantId = z.string().min(1).parse(form.get("variantId"));
  const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
  const margin = z.coerce.number().finite().min(0).max(99).parse(form.get("margin"));
  const scope = z.enum(["variant", "category"]).parse(form.get("scope"));
  const key = `variant:${variantId}`;
  const product = await prisma.product.findUniqueOrThrow({ where: { id: variant.productId } });
  const policyKey = scope === "category" ? `category:${product.categoryId}` : key;
  await prisma.marginPolicy.upsert({
    where: { key: policyKey },
    create: { key: policyKey, margin, confirmedBy: actor.userId },
    update: { margin, confirmedBy: actor.userId },
  });
  revalidatePath("/admin", "layout");
}
export async function clearVariantMargin(form: FormData) {
  await requireArea("suppliers");
  const id = z.string().min(1).parse(form.get("variantId"));
  await prisma.marginPolicy.deleteMany({ where: { key: `variant:${id}` } });
  revalidatePath("/admin", "layout");
}
export async function addMarketReference(form: FormData) {
  await requireArea("suppliers");
  const variantId = z.string().min(1).parse(form.get("variantId"));
  const variant = await prisma.productVariant.findUniqueOrThrow({
    where: { id: variantId },
    include: { product: true },
  });
  const url = validateMarketUrl(z.string().url().parse(form.get("url"))).url;
  const data = await fetchMarketListing(url);
  const existing = await prisma.marketListing.findUnique({ where: { url } });
  if (existing && existing.variantId !== variantId)
    throw new Error("Este enlace ya está vinculado a otra variante. Revisá la presentación.");
  await prisma.marketListing.upsert({
    where: { url },
    create: {
      variantId,
      url,
      ...data,
      identity: variantIdentity(variant),
      refreshedAt: new Date(),
    },
    update: {
      ...data,
      verifiedAt: null,
      verifiedBy: null,
      identity: variantIdentity(variant),
      refreshedAt: new Date(),
      error: null,
    },
  });
  revalidatePath("/admin", "layout");
}
export async function verifyMarketReference(form: FormData) {
  const actor = await requireArea("suppliers");
  if (form.get("exact") !== "on")
    throw new Error("Confirmá marca, medidas, material, presentación y unidad antes de aceptar.");
  const id = z.string().min(1).parse(form.get("id"));
  const row = await prisma.marketListing.findUniqueOrThrow({
    where: { id },
    include: { variant: { include: { product: true } } },
  });
  const data = await fetchMarketListing(row.url);
  await prisma.marketListing.update({
    where: { id },
    data: {
      ...data,
      identity: variantIdentity(row.variant),
      verifiedAt: new Date(),
      verifiedBy: actor.userId,
      refreshedAt: new Date(),
      error: null,
    },
  });
  revalidatePath("/admin", "layout");
}
export async function removeMarketReference(form: FormData) {
  await requireArea("suppliers");
  await prisma.marketListing.delete({ where: { id: z.string().min(1).parse(form.get("id")) } });
  revalidatePath("/admin", "layout");
}
export async function findMarketReferences(form: FormData) {
  await requireArea("suppliers");
  const count = await discoverMarket(z.string().min(1).parse(form.get("variantId")));
  revalidatePath("/admin", "layout");
  return `${count} publicaciones encontradas. Revisá la coincidencia antes de aceptarlas.`;
}
export async function publishVariantPrice(form: FormData) {
  const actor = await requireArea("products");
  await requireArea("suppliers");
  if (form.get("confirm") !== "on")
    throw new Error("Confirmá que querés actualizar el precio de venta de esta medida.");
  const variantId = z.string().min(1).parse(form.get("variantId"));
  const itemId = z.string().min(1).parse(form.get("supplierItemId"));
  const price = priceValue(String(form.get("price")));
  if (price == null || price <= 0) throw new Error("Ingresá un precio mayor a cero.");
  const state = await pricingForVariant(variantId, itemId);
  if (!state.selected || state.cost == null || !state.policy)
    throw new Error("Vinculá el costo y confirmá un objetivo de margen primero.");
  await prisma.$transaction(
    async (tx) => {
      const item = await tx.supplierItem.findUniqueOrThrow({ where: { id: itemId } });
      const variant = await tx.productVariant.findUniqueOrThrow({
        where: { id: variantId },
        include: { product: true },
      });
      const currentPrice = variant.price ?? variant.product.price;
      if (
        item.variantId !== variantId ||
        Number(item.listPrice) !== Number(form.get("expectedCost")) ||
        (currentPrice == null ? "" : String(Number(currentPrice))) !==
          String(form.get("expectedPrice"))
      )
        throw new Error("El costo o el precio cambió. Actualizá la página antes de confirmar.");
      await tx.productVariant.update({ where: { id: variantId }, data: { price } });
      await tx.priceChange.create({
        data: {
          variantId,
          oldPrice: currentPrice,
          newPrice: price,
          cost: Number(item.listPrice),
          supplierItemId: itemId,
          margin: ((price - Number(item.listPrice)) / price) * 100,
          market: state.market.average,
          userId: actor.userId,
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
  invalidateCatalog();
  revalidatePath("/", "layout");
}
