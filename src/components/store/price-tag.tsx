import { formatMoney } from "@/lib/format";

export function PriceTag({
  visibility,
  price,
  layout,
}: {
  visibility: "PUBLIC" | "HIDDEN" | "FROM" | string;
  price: number | null;
  layout?: "catalog";
}) {
  if (layout === "catalog") {
    if (visibility === "HIDDEN" || price == null) {
      return <span className="catalog-price-inquiry">Consultar precio</span>;
    }
    return (
      <span className="catalog-price">
        {visibility === "FROM" && <span className="catalog-price-prefix">Desde</span>}
        <span className="catalog-price-amount">{formatMoney(price)}</span>
      </span>
    );
  }
  if (visibility === "HIDDEN" || price == null) {
    return <span className="text-sm text-foreground">Consultar precio</span>;
  }
  const formatted = formatMoney(price);
  if (visibility === "FROM") {
    return <span className="font-mono text-sm tabular-nums">Desde {formatted}</span>;
  }
  return <span className="font-mono text-sm tabular-nums">{formatted}</span>;
}
