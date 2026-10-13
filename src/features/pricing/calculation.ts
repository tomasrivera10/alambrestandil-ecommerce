export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export function grossMargin(cost: number | null, price: number | null) {
  if (cost == null || price == null || cost <= 0 || price <= 0) return null;
  return ((price - cost) / price) * 100;
}
export function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
export type MarketSample = {
  id: string;
  seller: string;
  price: number | null;
  verified: boolean;
  fresh: boolean;
};
export function marketEstimate(samples: MarketSample[]) {
  // One observation per seller prevents repeated listings from dominating the mean.
  const sellers = new Map<string, number>();
  for (const sample of samples) {
    if (
      sample.verified &&
      sample.fresh &&
      sample.price != null &&
      sample.price > 0 &&
      !sellers.has(sample.seller.trim().toLowerCase())
    ) {
      sellers.set(sample.seller.trim().toLowerCase(), sample.price);
    }
  }
  const values = [...sellers.values()];
  const middle = median(values);
  const accepted =
    middle == null ? [] : values.filter((price) => price >= middle / 2 && price <= middle * 2);
  return {
    count: accepted.length,
    excluded: samples.length - accepted.length,
    average:
      accepted.length >= 3
        ? roundMoney(accepted.reduce((sum, n) => sum + n, 0) / accepted.length)
        : null,
  };
}
export function suggestPrice(
  cost: number | null,
  targetMargin: number | null,
  market: number | null,
) {
  if (cost == null || cost <= 0 || targetMargin == null || targetMargin < 0 || targetMargin >= 100)
    return null;
  const floor = roundMoney(cost / (1 - targetMargin / 100));
  return {
    floor,
    price: market == null ? floor : Math.max(floor, market),
    aboveMarket: market != null && floor > market,
    costOnly: market == null,
  };
}
export function variantIdentity(variant: {
  name: string;
  attributes: unknown;
  salesUnit: string | null;
  product: { name: string; brand: string | null; salesUnit: string };
}) {
  const attributes =
    variant.attributes && typeof variant.attributes === "object"
      ? Object.entries(variant.attributes).sort(([a], [b]) => a.localeCompare(b))
      : [];
  return JSON.stringify({
    product: variant.product.name,
    brand: variant.product.brand,
    variant: variant.name,
    unit: variant.salesUnit ?? variant.product.salesUnit,
    attributes,
  });
}
