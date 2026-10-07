"use client";
import { useId, useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  variants: inputVariants,
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
  const variants = [...inputVariants].sort((a, b) =>
    a.name.localeCompare(b.name, "es", { numeric: true }),
  );
  const labelId = useId();
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
      <fieldset className="variant-options">
        <legend id={labelId}>
          {variants.length === 1 ? "Presentación" : "Elegí tu medida o presentación"}
        </legend>
        {variants.length <= 6 ? (
          <div className="variant-choices">
            {variants.map((item) => {
              const entries = Object.values(item.attributes).filter(Boolean);
              const label = entries.length === 1 ? entries[0] : item.name;
              const duplicates =
                variants.filter(
                  (other) =>
                    Object.values(other.attributes).filter(Boolean).join(" · ") ===
                    entries.join(" · "),
                ).length > 1;
              return (
                <label key={item.id} className="variant-choice">
                  <input
                    type="radio"
                    name={labelId}
                    value={item.id}
                    checked={variant.id === item.id}
                    onChange={() => setId(item.id)}
                  />
                  <span>
                    {!duplicates && entries.length === 1 ? label : item.name}
                    <Check size={15} aria-hidden="true" />
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <Select
            value={variant.id}
            onValueChange={(value) => {
              if (value) setId(value);
            }}
            items={variants.map((item) => ({ value: item.id, label: item.name }))}
          >
            <SelectTrigger className="product-variant-trigger" aria-labelledby={labelId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="product-variant-menu" alignItemWithTrigger={false}>
              {variants.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </fieldset>
      <div className="variant-stock" role="status" aria-live="polite">
        <span className={variant.available > 0 ? "stock-indicator has-stock" : "stock-indicator"} />
        {variant.available > 0
          ? `${variant.available} ${unitLabel(unit)} disponibles`
          : "Consultar disponibilidad"}
        <small>SKU {variant.sku}</small>
      </div>
      <p className="variant-selected">{variant.name}</p>
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
      <p className="product-order-note">
        Sin pago online. Confirmamos precio, stock y entrega antes de cerrar el pedido.
      </p>
      <a className="product-help-link" href={whatsappUrl} target="_blank" rel="noreferrer">
        <MessageCircle size={16} /> ¿Tenés dudas? Consultanos por este producto
      </a>
    </div>
  );
}
