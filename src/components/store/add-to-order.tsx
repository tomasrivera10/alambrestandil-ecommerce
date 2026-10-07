"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/store";
import { ArrowUpRight, Check } from "lucide-react";

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
  const [added, setAdded] = useState(false);

  if (ctaType === "WHATSAPP" && whatsappUrl) {
    return (
      <Button
        nativeButton={false}
        render={<a href={whatsappUrl} target="_blank" rel="noreferrer" />}
      >
        {LABELS.WHATSAPP}
      </Button>
    );
  }

  return (
    <div className="add-to-order">
      <label className="grid gap-1 text-xs">
        Cantidad
        <input
          type="number"
          min={1}
          step={["METRO", "KG"].includes(unit) ? "0.001" : "1"}
          value={quantity}
          onChange={(event) => {
            setQuantity(Number(event.target.value));
            setAdded(false);
          }}
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
            quantity: Number.isFinite(quantity) ? Math.max(1, quantity) : 1,
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
        {added ? <Check size={17} /> : <ArrowUpRight size={17} />}
      </Button>
    </div>
  );
}
