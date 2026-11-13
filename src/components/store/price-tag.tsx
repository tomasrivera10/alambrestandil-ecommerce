import { formatMoney } from "@/lib/format";
import "./offer-price.css";

export function PriceTag({
  visibility,
  price,
  layout,
  regularPrice,
  promotionName,
}: {
  visibility: "PUBLIC" | "HIDDEN" | "FROM" | string;
  price: number | null;
  layout?: "catalog";
  regularPrice?: number | null;
  promotionName?: string | null;
}) {
  if (layout === "catalog") {
    if (visibility === "HIDDEN" || price == null) {
      return <span className="catalog-price-inquiry">Consultar precio</span>;
    }
    return (
      <span className="catalog-price">
        {visibility === "FROM" && <span className="catalog-price-prefix">Desde</span>}
        {regularPrice != null && regularPrice > price && (
          <span className="catalog-price-old">
            <s>{formatMoney(regularPrice)}</s>
            <span className="catalog-price-percent">{Math.round((1 - price / regularPrice) * 100)}% OFF</span>
            {promotionName && <span className="catalog-price-offer">{promotionName}</span>}
          </span>
        )}
        <span className="catalog-price-amount">{formatMoney(price)}</span>
      </span>
    );
  }
  if (visibility === "HIDDEN" || price == null) {
    return <span className="text-sm text-foreground">Consultar precio</span>;
  }
  const formatted = formatMoney(price);
  if (regularPrice != null && regularPrice > price)
    return (
      <span className="store-offer-price">
        <span className="store-offer-label">{promotionName || "Oferta"}</span>
        <s>{formatMoney(regularPrice)}</s>
        <strong>{formatted}</strong>
      </span>
    );
  if (visibility === "FROM") {
    return <span className="font-mono text-sm tabular-nums">Desde {formatted}</span>;
  }
  return <span className="font-mono text-sm tabular-nums">{formatted}</span>;
}
