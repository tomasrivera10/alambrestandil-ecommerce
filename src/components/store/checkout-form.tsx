"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useCart, useCartLines } from "@/features/cart/store";
import { createOrder } from "@/features/orders/actions";
import { formatMoney } from "@/lib/format";

export function CheckoutForm() {
  const lines = useCartLines();
  const clear = useCart((state) => state.clear);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [fulfillment, setFulfillment] = useState<"RETIRO" | "ENVIO">("RETIRO");

  if (lines.length === 0) {
    return (
      <div className="catalog-empty">
        <h2>Tu próximo proyecto empieza acá.</h2>
        <p>Agregá materiales al pedido y te ayudamos a confirmar cantidades y entrega.</p>
        <Link href="/productos" className="store-button button-red">
          Explorar productos
        </Link>
      </div>
    );
  }

  const estimated = lines.reduce((sum, line) => {
    if (line.unitPrice == null || line.priceVisibility === "HIDDEN") return sum;
    return sum + line.unitPrice * line.quantity;
  }, 0);
  const hasPrice = lines.some(
    (line) => line.unitPrice != null && line.priceVisibility !== "HIDDEN",
  );

  return (
    <form
      className="store-form grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setPending(true);
        setError(null);
        try {
          const result = await createOrder({
            name: String(form.get("name")),
            phone: String(form.get("phone")),
            locality: String(form.get("locality")),
            fulfillment,
            address: String(form.get("address") || ""),
            notes: String(form.get("notes") || ""),
            items: lines.map((line) => ({
              variantId: line.variantId,
              quantity: line.quantity,
            })),
          });
          clear();
          sessionStorage.setItem("last-order-whatsapp", result.url);
          router.push(`/pedido/enviado?n=${result.number}`);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "No pudimos crear el pedido.");
        } finally {
          setPending(false);
        }
      }}
    >
      <ul className="divide-y divide-border border-y border-border text-sm">
        {lines.map((line) => (
          <li key={line.variantId} className="flex justify-between gap-4 py-3">
            <span>
              {line.productName}
              <span className="block text-muted-foreground">{line.variantName}</span>
            </span>
            <span className="font-mono">{line.quantity}</span>
          </li>
        ))}
      </ul>
      <p className="font-mono text-sm">
        Total estimado: {hasPrice ? formatMoney(estimated) : "A confirmar"}
      </p>
      <label className="grid gap-1 text-sm">
        Nombre
        <Input name="name" required autoComplete="name" />
      </label>
      <label className="grid gap-1 text-sm">
        Teléfono
        <Input name="phone" type="tel" required autoComplete="tel" />
      </label>
      <label className="grid gap-1 text-sm">
        Localidad
        <Input name="locality" required defaultValue="Tandil" />
      </label>
      <fieldset className="grid gap-2 text-sm">
        <legend>Entrega</legend>
        <label className="flex gap-2">
          <input
            type="radio"
            name="fulfillment"
            checked={fulfillment === "RETIRO"}
            onChange={() => setFulfillment("RETIRO")}
          />
          Retiro en el local
        </label>
        <label className="flex gap-2">
          <input
            type="radio"
            name="fulfillment"
            checked={fulfillment === "ENVIO"}
            onChange={() => setFulfillment("ENVIO")}
          />
          Envío
        </label>
      </fieldset>
      {fulfillment === "ENVIO" ? (
        <label className="grid gap-1 text-sm">
          Dirección
          <Input name="address" required />
        </label>
      ) : null}
      <label className="grid gap-1 text-sm">
        Observaciones
        <Textarea name="notes" placeholder="Metros aproximados, acceso, horario" />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creando pedido" : "Enviar por WhatsApp"}
      </Button>
    </form>
  );
}
