"use client";
import { useState } from "react";
import { AddToOrder } from "./add-to-order";
import { PriceTag } from "./price-tag";
import { unitLabel } from "@/lib/format";
import { filterLabels } from "@/content/storefront";
type Variant = {
  id: string;
  name: string;
  sku: string;
  price: number | null;
  salesUnit: string | null;
  available: number;
  attributes: Record<string, string>;
};
export function VariantPicker({
  variants,
  productName,
  href,
  fallbackUnit,
  fallbackPrice,
  priceVisibility,
  imageUrl,
  ctaType,
  whatsappUrl,
}: {
  variants: Variant[];
  productName: string;
  href: string;
  fallbackUnit: string;
  fallbackPrice: number | null;
  priceVisibility: "PUBLIC" | "HIDDEN" | "FROM";
  imageUrl: string | null;
  ctaType: string;
  whatsappUrl: string;
}) {
  const [id, setId] = useState(variants[0]?.id ?? "");
  const variant = variants.find((item) => item.id === id) ?? variants[0];
  if (!variant) return null;
  const unit = variant.salesUnit ?? fallbackUnit;
  return (
    <div id="pedido" className="variant-panel">
      <div className="variant-price">
        <PriceTag visibility={priceVisibility} price={variant.price ?? fallbackPrice} />
        <span>por {unitLabel(unit, 1)}</span>
      </div>
      <label className="variant-select">
        Elegí tu medida
        <select value={variant.id} onChange={(event) => setId(event.target.value)}>
          {variants.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <div className="variant-stock">
        <span className={variant.available > 0 ? "stock-indicator has-stock" : "stock-indicator"} />
        {variant.available > 0
          ? `${variant.available} ${unitLabel(unit)} disponibles`
          : "Consultar disponibilidad"}
        <small>SKU {variant.sku}</small>
      </div>
      {Object.keys(variant.attributes).length > 0 && (
        <dl className="variant-attributes">
          {Object.entries(variant.attributes).map(([key, value]) => (
            <div key={key}>
              <dt>{filterLabels[key] ?? key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <AddToOrder
        key={variant.id}
        variantId={variant.id}
        productName={productName}
        variantName={variant.name}
        href={href}
        unit={unit}
        unitPrice={variant.price ?? fallbackPrice}
        priceVisibility={priceVisibility}
        imageUrl={imageUrl}
        ctaType={ctaType}
        whatsappUrl={whatsappUrl}
      />
    </div>
  );
}
