import "server-only";
import { cache } from "react";
import { prisma } from "@/server/db";
import {
  grossMargin,
  median,
  marketEstimate,
  suggestPrice,
  variantIdentity,
} from "@/features/pricing/calculation";
export async function pricingForVariant(variantId: string, supplierItemId?: string) {
  const variant = await prisma.productVariant.findUniqueOrThrow({
    where: { id: variantId },
    include: {
      product: { include: { category: true } },
      supplierItems: { include: { supplier: true } },
      marketListings: true,
    },
  });
  const policies = await prisma.marginPolicy.findMany({
    where: { key: { in: [`variant:${variantId}`, `category:${variant.product.categoryId}`] } },
  });
  const specific = policies.find((p) => p.key === `variant:${variantId}`),
    family = policies.find((p) => p.key === `category:${variant.product.categoryId}`);
  const policy = specific ?? family;
  // A specific supplier choice is required when more than one cost exists.
  const linked = variant.supplierItems.filter((i) => i.listPrice && Number(i.listPrice) > 0);
  const selected = supplierItemId
    ? linked.find((i) => i.id === supplierItemId)
    : linked.length === 1
      ? linked[0]
      : null;
  const cost = selected ? Number(selected.listPrice) : null;
  const price =
    variant.price == null
      ? variant.product.price == null
        ? null
        : Number(variant.product.price)
      : Number(variant.price);
  const identity = variantIdentity(variant);
  const samples = variant.marketListings.map((row) => ({
    id: row.id,
    seller: row.seller,
    price: row.price == null ? null : Number(row.price),
    verified: !!row.verifiedAt && row.identity === identity,
    fresh:
      !!row.refreshedAt &&
      !row.error &&
      Date.now() - row.refreshedAt.getTime() < 36 * 60 * 60 * 1000,
  }));
  const market = marketEstimate(samples);
  const recommendation = suggestPrice(cost, policy?.margin ?? null, market.average);
  return {
    variant,
    identity,
    cost,
    price,
    selected,
    linked,
    policy,
    policySource: specific ? "Variante" : family ? "Familia" : null,
    observed: grossMargin(cost, price),
    market,
    recommendation,
  };
}
export const familyObservedMargin = cache(async (categoryId: string) => {
  const variants = await prisma.productVariant.findMany({
    where: { product: { categoryId }, active: true },
    include: { product: true, supplierItems: true },
  });
  const values = variants.flatMap((v) => {
    const costs = v.supplierItems.filter((i) => i.listPrice && Number(i.listPrice) > 0);
    if (costs.length !== 1) return [];
    const observed = grossMargin(
      Number(costs[0].listPrice),
      v.price == null
        ? v.product.price == null
          ? null
          : Number(v.product.price)
        : Number(v.price),
    );
    return observed == null || observed < 0 || observed >= 100 ? [] : [observed];
  });
  return { margin: median(values), count: values.length };
});
