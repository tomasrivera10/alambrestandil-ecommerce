"use client";

import { useState } from "react";
import { AddToOrder } from "@/components/store/add-to-order";
import { unitLabel } from "@/lib/format";

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
    <div id="pedido" className="mt-6 border border-border bg-card p-4">
      <label className="grid gap-1 text-xs">
        Variante
        <select
          className="h-10 border border-input bg-background px-2 text-sm"
          value={variant.id}
          onChange={(event) => setId(event.target.value)}
        >
          {variants.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-3 font-mono text-xs text-muted-foreground">SKU {variant.sku}</p>
      <p className="mt-2 text-sm">
        {variant.available > 0
          ? `${variant.available} ${unitLabel(unit)} disponibles`
          : "Consultar disponibilidad"}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {Object.entries(variant.attributes).map(([key, value]) => (
          <div key={key} className="border-t border-border pt-2">
            <dt className="text-xs text-muted-foreground">{key}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5">
        <AddToOrder
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
    </div>
  );
}
