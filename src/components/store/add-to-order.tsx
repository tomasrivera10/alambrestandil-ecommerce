"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/store";

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
  const add = useCart((state) => state.add);
  const [quantity, setQuantity] = useState(1);

  if (ctaType === "WHATSAPP" && whatsappUrl) {
    return (
      <Button render={<a href={whatsappUrl} target="_blank" rel="noreferrer" />}>
        {LABELS.WHATSAPP}
      </Button>
    );
  }

  return (
    <div className="flex items-end gap-3">
      <label className="grid gap-1 text-xs">
        Cantidad
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
          className="h-10 w-20 border border-input bg-card px-2 font-mono"
        />
      </label>
      <Button
        onClick={() => {
          add({
            variantId,
            productName,
            variantName,
            href,
            quantity: Math.max(1, quantity),
            unit,
            unitPrice,
            priceVisibility,
            imageUrl,
          });
          toast.success("Agregado al pedido");
        }}
      >
        {LABELS[ctaType] ?? LABELS.ADD_TO_ORDER}
      </Button>
    </div>
  );
}
