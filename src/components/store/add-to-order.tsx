"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { unitLabel } from "@/lib/format";
import { useCart } from "@/features/cart/store";
import { ShoppingBag, Check, Minus, Plus, MessageCircle } from "lucide-react";

const LABELS: Record<string, string> = {
  ADD_TO_ORDER: "Agregar al pedido",
  REQUEST_QUOTE: "Pedir presupuesto",
  CHECK_AVAILABILITY: "Consultar disponibilidad",
  WHATSAPP: "Consultar por WhatsApp",
  BUILD_ORDER: "Armar mi pedido",
};

export function AddToOrder({
  variantId,
  productName,
  variantName,
  href,
  unit,
  unitPrice,
  priceVisibility,
  imageUrl,
  ctaType,
  whatsappUrl,
}: {
  variantId: string;
  productName: string;
  variantName: string;
  href: string;
  unit: string;
  unitPrice: number | null;
  priceVisibility: "PUBLIC" | "HIDDEN" | "FROM";
  imageUrl: string | null;
  ctaType: string;
  whatsappUrl?: string;
}) {
  const quantityId = useId();
  const fractional = ["METRO", "KG"].includes(unit);
  const add = useCart((state) => state.add);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const validQuantity =
    Number.isFinite(quantity) && quantity >= 1 && (fractional || Number.isInteger(quantity));
  const updateQuantity = (value: number) => {
    setQuantity(value);
    setAdded(false);
  };

  if (ctaType === "WHATSAPP" && whatsappUrl) {
    return (
      <Button
        nativeButton={false}
        render={<a href={whatsappUrl} target="_blank" rel="noreferrer" />}
      >
        <MessageCircle size={17} /> {LABELS.WHATSAPP}
      </Button>
    );
  }

  return (
    <div className="add-to-order">
      <div className="product-quantity-field">
        <label htmlFor={quantityId}>
          Cantidad <span>({unitLabel(unit)})</span>
        </label>
        <div className="product-quantity-stepper">
          <button
            type="button"
            aria-label="Restar uno"
            disabled={!validQuantity || quantity <= 1}
            onClick={() => updateQuantity(Math.max(1, Number((quantity - 1).toFixed(3))))}
          >
            <Minus size={16} />
          </button>
          <input
            id={quantityId}
            type="number"
            min={1}
            step={fractional ? "0.001" : "1"}
            value={Number.isNaN(quantity) ? "" : quantity}
            onChange={(event) => updateQuantity(event.target.valueAsNumber)}
            aria-invalid={!validQuantity}
            aria-describedby={!validQuantity ? `${quantityId}-error` : undefined}
          />
          <button
            type="button"
            aria-label="Sumar uno"
            onClick={() => updateQuantity(validQuantity ? Number((quantity + 1).toFixed(3)) : 1)}
          >
            <Plus size={16} />
          </button>
        </div>
        {!validQuantity && (
          <p id={`${quantityId}-error`} className="quantity-error">
            {fractional
              ? "Ingresá una cantidad de al menos 1."
              : "Ingresá un número entero de al menos 1."}
          </p>
        )}
      </div>
      <Button
        className="product-order-button"
        disabled={!validQuantity}
        onClick={() => {
          add({
            variantId,
            productName,
            variantName,
            href,
            quantity,
            unit,
            unitPrice,
            priceVisibility,
            imageUrl,
          });
          toast.success("Agregado al pedido");
          setAdded(true);
        }}
      >
        {added ? "Agregado al pedido" : (LABELS[ctaType] ?? LABELS.ADD_TO_ORDER)}
        {added ? <Check size={17} /> : <ShoppingBag size={17} />}
      </Button>
    </div>
  );
}
